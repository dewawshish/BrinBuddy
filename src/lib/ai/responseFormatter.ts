/**
 * BrainBuddy AI Response Formatter
 * Formats and structures AI responses into standardized formats
 */

import { AINotesStructure } from '@/types/ai';

/**
 * Parse notes structure from raw AI response
 */
export const parseNotesResponse = (response: string): AINotesStructure => {
  const sections = parseMarkdownSections(response);

  return {
    quickOverview: extractSection(sections, ['quick overview', 'overview']),
    keyConcepts: extractList(sections, ['key concepts', 'concepts', 'main concepts']),
    detailedExplanation: extractSection(sections, ['detailed explanation', 'explanation', 'how it works']),
    examplesApplications: extractSection(sections, ['examples', 'applications', 'examples & applications']),
    formulasFactsRules: extractSection(sections, [
      'formulas',
      'facts',
      'rules',
      'formulas & steps',
      'formulas & facts',
    ]),
    examTipsTrap: extractSection(sections, ['exam tips', 'tips', 'common mistakes', 'exam tips & mistakes']),
    quickRevisionBox: extractSection(sections, [
      'quick revision',
      'revision box',
      'summary',
      'quick revision box',
    ]),
  };
};

/**
 * Parse markdown sections from raw text
 */
function parseMarkdownSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = text.split('\n');
  let currentSection = 'intro';
  let currentContent = '';

  for (const line of lines) {
    if (line.startsWith('##')) {
      if (currentContent) {
        sections.set(currentSection, currentContent.trim());
      }
      currentSection = line.replace(/^#+\s*/, '').toLowerCase();
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  }

  if (currentContent) {
    sections.set(currentSection, currentContent.trim());
  }

  return sections;
}

/**
 * Extract section by multiple possible names
 */
function extractSection(sections: Map<string, string>, possibleNames: string[]): string {
  for (const name of possibleNames) {
    for (const [key, value] of sections) {
      if (key.includes(name)) {
        return value.slice(0, 500); // Limit to 500 chars per section
      }
    }
  }
  return '';
}

/**
 * Extract list items from a section
 */
function extractList(sections: Map<string, string>, possibleNames: string[]): string[] {
  const section = extractSection(sections, possibleNames);
  const items = section
    .split('\n')
    .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter((item) => item.length > 0)
    .slice(0, 10); // Max 10 items

  return items.length > 0 ? items : ['See detailed explanation above'];
}

/**
 * Format notes for display
 */
export const formatNotesForDisplay = (notes: AINotesStructure): string => {
  let formatted = '';

  if (notes.quickOverview) {
    formatted += `## Overview\n${notes.quickOverview}\n\n`;
  }

  if (notes.keyConcepts?.length > 0) {
    formatted += `## Key Concepts\n${notes.keyConcepts.map((c) => `- ${c}`).join('\n')}\n\n`;
  }

  if (notes.detailedExplanation) {
    formatted += `## Detailed Explanation\n${notes.detailedExplanation}\n\n`;
  }

  if (notes.examplesApplications) {
    formatted += `## Examples & Applications\n${notes.examplesApplications}\n\n`;
  }

  if (notes.formulasFactsRules) {
    formatted += `## Formulas & Rules\n${notes.formulasFactsRules}\n\n`;
  }

  if (notes.examTipsTrap) {
    formatted += `## Exam Tips\n${notes.examTipsTrap}\n\n`;
  }

  if (notes.quickRevisionBox) {
    formatted += `## Quick Revision\n${notes.quickRevisionBox}\n`;
  }

  return formatted;
};

/**
 * Extract plain text from markdown
 */
export const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/[*_~]/g, '') // Remove emphasis
    .replace(/`/g, '') // Remove code ticks
    .replace(/[-*]\s/g, '') // Remove list markers
    .trim();
};

/**
 * Format chat message for display
 */
export const formatChatMessage = (content: string, isAssistant: boolean): string => {
  if (!isAssistant) {
    return content;
  }

  // Properly format markdown for AI messages
  return content
    .split('\n')
    .map((line) => {
      // Bold section titles
      if (line.match(/^#+\s/)) {
        return line.replace(/^#+\s/, '**').concat('**');
      }
      return line;
    })
    .join('\n');
};

/**
 * Validate AI response
 */
export const validateAIResponse = (response: string): { valid: boolean; error?: string } => {
  if (!response || typeof response !== 'string') {
    return { valid: false, error: 'Invalid response type' };
  }

  if (response.length < 50) {
    return { valid: false, error: 'Response too short' };
  }

  if (response.length > 50000) {
    return { valid: false, error: 'Response too long' };
  }

  return { valid: true };
};
