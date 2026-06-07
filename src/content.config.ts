import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const transcriptSpanSchema = z
  .object({
    entryId: z.string().min(1),
    start: z.number().int().nonnegative().optional(),
    end: z.number().int().nonnegative().optional(),
    label: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (span) => span.start === undefined || span.end === undefined || span.end >= span.start,
    'Transcript span end must be greater than or equal to start',
  );

const logTranscriptSchema = z
  .object({
    session: z.string().min(1),
    title: z.string().min(1).optional(),
    href: z.string().min(1).optional(),
    spans: z.array(transcriptSpanSchema).default([]),
  })
  .strict();

const log = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/log' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    agents: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    transcript: logTranscriptSchema.optional(),
  }),
});

const transcriptTextBlockSchema = z
  .object({
    type: z.literal('text'),
    text: z.string(),
    format: z.enum(['markdown', 'plain']).default('markdown'),
  })
  .strict();

const transcriptToolCallBlockSchema = z
  .object({
    type: z.literal('tool_call'),
    toolCallId: z.string().min(1),
    name: z.string().min(1),
    arguments: z.unknown().optional(),
  })
  .strict();

const transcriptToolResultBlockSchema = z
  .object({
    type: z.literal('tool_result'),
    toolCallId: z.string().min(1),
    content: z.string(),
    status: z.enum(['success', 'error']).default('success'),
    truncated: z.boolean().default(false),
    collapsed: z.boolean().default(false),
  })
  .strict();

const transcriptErrorBlockSchema = z
  .object({
    type: z.literal('error'),
    message: z.string().min(1),
    code: z.string().min(1).optional(),
  })
  .strict();

const transcriptContentBlockSchema = z.discriminatedUnion('type', [
  transcriptTextBlockSchema,
  transcriptToolCallBlockSchema,
  transcriptToolResultBlockSchema,
  transcriptErrorBlockSchema,
]);

const transcriptRedactionSchema = z
  .object({
    kind: z.enum(['secret', 'path', 'pi-session-path', 'temporary-path', 'long-blob', 'environment-value', 'other']),
    replacement: z.string().min(1),
    count: z.number().int().positive(),
  })
  .strict();

const transcriptOmissionSchema = z
  .object({
    kind: z.literal('thinking'),
    count: z.number().int().positive(),
    reason: z.string().min(1),
  })
  .strict();

const transcriptRedactionMetadataSchema = z
  .object({
    status: z.enum(['processed', 'needs_review']).default('processed'),
    reviewNotes: z.array(z.string().min(1)).default([]),
  })
  .strict();

const transcriptEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    index: z.number().int().nonnegative(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    source: z.enum(['pi', 'importer']).default('pi'),
    sourceId: z.string().min(1).optional(),
    createdAt: z.iso.datetime({ offset: true }).optional(),
    parentId: z.string().min(1).optional(),
    branch: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    content: z.array(transcriptContentBlockSchema).min(1),
    omissions: z.array(transcriptOmissionSchema).default([]),
    redactions: z.array(transcriptRedactionSchema).default([]),
    truncated: z.boolean().default(false),
  })
  .strict();

const transcriptHighlightSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    title: z.string().min(1),
    summary: z.string().min(1),
    entries: z.array(z.string().min(1)).min(1),
  })
  .strict();

const session = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/sessions' }),
  schema: z
    .object({
      schemaVersion: z.literal(1),
      title: z.string().min(1),
      summary: z.string().min(1).optional(),
      source: z
        .object({
          kind: z.literal('pi'),
          sessionId: z.string().min(1).optional(),
          importedAt: z.iso.datetime({ offset: true }),
          sessionStartedAt: z.iso.datetime({ offset: true }).optional(),
        })
        .strict(),
      participants: z
        .array(
          z
            .object({
              id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
              name: z.string().min(1),
              role: z.enum(['user', 'assistant', 'system', 'tool']),
            })
            .strict(),
        )
        .min(1),
      entries: z.array(transcriptEntrySchema).min(1),
      highlights: z.array(transcriptHighlightSchema).default([]),
      redactionSummary: z.array(transcriptRedactionSchema).default([]),
      redaction: transcriptRedactionMetadataSchema.default({ status: 'processed', reviewNotes: [] }),
    })
    .strict()
    .refine(
      (data) => new Set(data.entries.map((entry) => entry.id)).size === data.entries.length,
      'Transcript entry IDs must be unique',
    )
    .refine(
      (data) => new Set(data.entries.map((entry) => entry.index)).size === data.entries.length,
      'Transcript entry indexes must be unique',
    ),
});

const project = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/project' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { log, project, session };
