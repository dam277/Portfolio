import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Profile
const aboutCollection = defineCollection({
    loader: glob({
        pattern: '*.md',
        base: './src/content/about',
    }),
    schema: z.object({
        title: z.string(),
        location: z.string(),
        interests: z.array(z.string())
    })
});

// Timeline
const timelineCollection = defineCollection({
    loader: glob({ 
        pattern: '**/*.md',
        base: './src/content/timeline',
    }),
    schema: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        type: z.enum(['career', 'education', 'certification']),
    })
});

// Projects
const projectsCollection = defineCollection({
    loader: glob({
        pattern: '**/*.md',
        base: './src/content/projects',
    }),
    schema: ({ image }) => 
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            categories: z.enum(['web', 'mobile', 'desktop', 'game', 'other']).array(),
            tags: z.string().array(),
            status: z.enum(['completed', 'in-progress']),
            featured: z.boolean().default(false),
            coverImage: image().optional(),
            githubUrl: z.url().optional(),
            liveUrl: z.url().optional(),
            stack: z.array(z.string()).optional(),
    })
});

// Roadmap
const roadmapCollection = defineCollection({
    loader: glob({
        pattern: '**/*.md',
        base: './src/content/roadmap',
    }),
    schema: z.object({
        title: z.string(),
        focusNumber: z.number(),
        description: z.string(),
        stack: z.array(z.string()).optional(),
    })
});

export const collections = {
    about: aboutCollection,
    timeline: timelineCollection,
    projects: projectsCollection,
    roadmap: roadmapCollection
};