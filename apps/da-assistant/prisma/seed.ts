import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data for seeding the database
async function main() {
  console.log('Starting to seed database...');
  
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  
  console.log(`Created user: ${user.name} (${user.id})`);
  
  // Create a test session
  const session = await prisma.session.create({
    data: {
      title: 'Test Conversation',
      userId: user.id,
    },
  });
  
  console.log(`Created session: ${session.title} (${session.id})`);
  
  // Create some test messages
  const messages = await Promise.all([
    // User message
    prisma.message.create({
      data: {
        sessionId: session.id,
        content: 'Hello, Da Assistent! How can you help me today?',
        senderId: user.id,
      },
    }),
    
    // Assistant message
    prisma.message.create({
      data: {
        sessionId: session.id,
        content: 'Hello! I\'m Da Assistent, your AI-powered chatbot. I can answer questions, provide information, and help with various tasks. How can I assist you today?',
        senderId: 'da-assistant',
      },
    }),
    
    // User follow-up
    prisma.message.create({
      data: {
        sessionId: session.id,
        content: 'Can you tell me about your features?',
        senderId: user.id,
      },
    }),
    
    // Assistant response
    prisma.message.create({
      data: {
        sessionId: session.id,
        content: 'Certainly! I have several key features:\n\n1. I can maintain persistent conversations with memory of our chat history\n2. I summarize older conversations so I can reference past topics\n3. I connect to external tools via the Model Context Protocol (MCP)\n4. I support multiple users with isolated sessions\n5. I can provide streaming responses for real-time interaction\n\nIs there anything specific you\'d like to know more about?',
        senderId: 'da-assistant',
      },
    }),
  ]);
  
  console.log(`Created ${messages.length} messages`);
  
  // Create a second session
  const secondSession = await prisma.session.create({
    data: {
      title: 'Questions About AI',
      userId: user.id,
    },
  });
  
  console.log(`Created session: ${secondSession.title} (${secondSession.id})`);
  
  // Create messages for second session
  const secondSessionMessages = await Promise.all([
    // User message
    prisma.message.create({
      data: {
        sessionId: secondSession.id,
        content: 'What is artificial intelligence?',
        senderId: user.id,
      },
    }),
    
    // Assistant message
    prisma.message.create({
      data: {
        sessionId: secondSession.id,
        content: 'Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect. AI manifests in a number of forms such as:\n\n1. **Narrow/Weak AI**: Systems designed for a particular task (like virtual assistants)\n2. **General/Strong AI**: Systems with generalized human cognitive abilities\n3. **Machine Learning**: AI systems that can learn from and improve with experience\n4. **Deep Learning**: AI that uses neural networks with many layers\n\nAI is now used across many fields including healthcare, finance, transportation, and entertainment. I\'m an example of an AI system designed to have conversational abilities.',
        senderId: 'da-assistant',
      },
    }),
  ]);
  
  console.log(`Created ${secondSessionMessages.length} messages in second session`);
  
  console.log('Database seeding completed successfully!');
}

// Execute the seeding
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });