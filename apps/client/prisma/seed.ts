import { PrismaClient, UserRole } from 'cd';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create a demo organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      ownerId: 'demo-owner', // This will be replaced when the user authenticates
      billingEmail: 'admin@demo-org.com',
      settings: {
        features: {
          rewards: true,
          challenges: true,
          games: true,
          leaderboard: true,
        }
      }
    },
  });
  
  console.log(`Created organization: ${demoOrg.name}`);

  // Create demo projects (tenants)
  const projectData = [
    {
      name: 'Coffee Rewards',
      slug: 'coffee-rewards',
      settings: {
        pointsPerDollar: 10,
        minimumPointsRedemption: 500,
        welcomeBonus: 100,
      },
      theme: {
        colors: {
          primary: {
            DEFAULT: '#6D4534',
            50: '#F5EDE9',
            100: '#EBDBD3',
            200: '#D6B8A7',
            300: '#C2947B',
            400: '#AD714F',
            500: '#6D4534',
            600: '#5A392B',
            700: '#482E23',
            800: '#35221A',
            900: '#231711',
          },
          secondary: {
            DEFAULT: '#D4A762', 
          },
        },
        borderRadius: {
          sm: '0.25rem',
          DEFAULT: '0.375rem',
          md: '0.5rem',
          lg: '1rem',
          xl: '1.5rem',
        },
      },
    },
    {
      name: 'Fitness Club',
      slug: 'fitness-club',
      settings: {
        pointsPerVisit: 50,
        pointsPerReferral: 200,
        challengeBonus: 500,
      },
      theme: {
        colors: {
          primary: {
            DEFAULT: '#2563EB',
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD', 
            400: '#60A5FA',
            500: '#2563EB',
            600: '#1D4ED8',
            700: '#1E40AF',
            800: '#1E3A8A',
            900: '#172554',
          },
          secondary: {
            DEFAULT: '#10B981',
          },
        },
        borderRadius: {
          sm: '0.125rem',
          DEFAULT: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
        },
      },
    },
    {
      name: 'Book Store',
      slug: 'book-store',
      settings: {
        pointsPerPurchase: 50,
        pointsPerReview: 20,
        monthlyReadingChallenge: 200,
      },
      theme: {
        colors: {
          primary: {
            DEFAULT: '#7C3AED',
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            400: '#C084FC',
            500: '#7C3AED',
            600: '#6D28D9',
            700: '#5B21B6',
            800: '#4C1D95',
            900: '#2E1065',
          },
          secondary: {
            DEFAULT: '#EC4899',
          },
        },
        borderRadius: {
          sm: '0.5rem',
          DEFAULT: '0.75rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
      },
    },
  ];

  for (const project of projectData) {
    const createdProject = await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: {
        name: project.name,
        slug: project.slug,
        settings: project.settings,
        theme: project.theme,
        organizationId: demoOrg.id,
      },
    });
    
    console.log(`Created project: ${createdProject.name}`);

    // Create an API key for each project
    const apiKey = await prisma.apiKey.upsert({
      where: { 
        key: `${project.slug}_${randomUUID().substring(0, 8)}` 
      },
      update: {},
      create: {
        name: 'Development API Key',
        key: `${project.slug}_${randomUUID().substring(0, 8)}`,
        projectId: createdProject.id,
      },
    });
    
    console.log(`Created API key for project ${project.name}: ${apiKey.key}`);
  }

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'admin@demo-org.com' },
    update: {},
    create: {
      email: 'admin@demo-org.com',
      name: 'Demo Admin',
      supabaseUserId: 'demo-user-id', // This will be replaced when the user authenticates
    },
  });

  console.log(`Created user: ${demoUser.email}`);

  // Associate user with organization
  const userOrg = await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: demoUser.id,
        organizationId: demoOrg.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      role: UserRole.OWNER,
    },
  });

  console.log(`Associated user ${demoUser.email} with organization ${demoOrg.name}`);

  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });