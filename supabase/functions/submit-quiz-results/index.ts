// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-expect-error - Deno module imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno module imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://brainbuddy.app',
  'https://www.brainbuddy.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://lovable.dev',
];

function getCORSHeaders(originHeader: string | null): Record<string, string> {
  const allowedOrigin = (originHeader && ALLOWED_ORIGINS.includes(originHeader))
    ? originHeader
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '3600',
  };
}

interface QuizSubmission {
  quizId: string;
  answers: number[];
  coinRewards: number[];
  totalCoins: number;
}

interface QuizQuestion {
  correctAnswer?: number;
  correct_answer?: number;
  difficulty?: string;
}

function getDifficultyReward(difficulty: string | undefined): number {
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 5;
    case 'hard':
      return 10;
    default:
      return 0;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    const corsHeaders = getCORSHeaders(req.headers.get('origin'));
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const corsHeaders = getCORSHeaders(req.headers.get('origin'));
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const submission = await req.json() as QuizSubmission;

    if (!submission.quizId || !Array.isArray(submission.answers) || !Array.isArray(submission.coinRewards)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: quizId, answers, coinRewards" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch quiz from database
    const { data: quizData, error: quizError } = await supabaseClient
      .from('quizzes')
      .select('id, todo_id, questions, user_id')
      .eq('id', submission.quizId)
      .single();

    if (quizError || !quizData) {
      console.error("Quiz not found:", quizError);
      return new Response(
        JSON.stringify({ error: "Quiz not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify quiz belongs to user
    if (quizData.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to quiz" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const questions = quizData.questions as QuizQuestion[];
    const todoId = quizData.todo_id as string;

    // SERVER-SIDE VALIDATION: Recalculate coins to prevent manipulation
    let validatedCoins = 0;
    const validatedRewards: number[] = [];
    let correctCount = 0;

    questions.forEach((q, i) => {
      const userAnswer = submission.answers[i];
      // Handle both correctAnswer and correct_answer field names
      const correctAnswer = (q.correctAnswer ?? q.correct_answer) as number | undefined;
      const isCorrect = userAnswer === correctAnswer;

      let expectedReward = 0;
      if (isCorrect) {
        expectedReward = getDifficultyReward(q.difficulty);
        correctCount++;
      }

      validatedRewards.push(expectedReward);
      validatedCoins += expectedReward;
    });

    // Check if client's calculation matches server
    if (submission.totalCoins !== validatedCoins) {
      console.warn(
        `Coin calculation mismatch for user ${userId}: ` +
        `client=${submission.totalCoins}, server=${validatedCoins}`
      );
      return new Response(
        JSON.stringify({ error: "Coin calculation mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert quiz results
    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const { data: resultData, error: resultError } = await supabaseClient
      .from('quiz_results')
      .insert({
        user_id: userId,
        todo_id: todoId,
        quiz_id: submission.quizId,
        answers: submission.answers,
        score: Math.round(score),
        correct_answers: correctCount,
        total_questions: questions.length,
        coins_earned: validatedCoins,
      })
      .select()
      .single();

    if (resultError) {
      console.error("Error saving quiz results:", resultError);
      return new Response(
        JSON.stringify({ error: "Failed to save quiz results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Award coins through atomic transaction if coins > 0
    if (validatedCoins > 0) {
      const { error: coinError } = await supabaseClient.rpc(
        'add_coins_transaction',
        {
          p_user_id: userId,
          p_amount: validatedCoins,
          p_source: 'quiz_completion',
          p_metadata: {
            quiz_id: submission.quizId,
            quiz_result_id: resultData.id,
            rewards_breakdown: validatedRewards,
          },
        }
      );

      if (coinError) {
        console.error("Error awarding coins:", coinError);
        return new Response(
          JSON.stringify({ error: "Failed to award coins" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Coins awarded: ${validatedCoins} to user ${userId}`);
    }

    // Calculate reward breakdown by difficulty
    const rewardBreakdown = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    questions.forEach((q, i) => {
      const reward = validatedRewards[i];
      if (reward > 0) {
        const difficulty = (q.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard';
        rewardBreakdown[difficulty] += reward;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        coins_earned: validatedCoins,
        rewards_breakdown: validatedRewards,
        reward_breakdown: rewardBreakdown,
        score: Math.round(score),
        correct_answers: correctCount,
        total_questions: questions.length,
        result_id: resultData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-quiz-results function:", error);
    const errorCorsHeaders = getCORSHeaders(null);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...errorCorsHeaders, "Content-Type": "application/json" } }
    );
  }
});
