import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log('📊 PostgreSQL version:', (result as any)[0]?.version || 'Unknown');
    
    // Check if users table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\n📋 Available tables:');
    (tables as any[]).forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
    
    console.log('\n🎉 Database connection test passed!');
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

