import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Handle module aliases (e.g., '@/components/*')
  },
  coverageProvider: 'v8',
};

export default createJestConfig(config);