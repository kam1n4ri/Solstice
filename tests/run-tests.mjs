import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });

  try {
    const mod = await server.ssrLoadModule('/tests/suite.test.ts');
    await mod.runAllTests();
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error('Unit test suite failed:', err);
  process.exit(1);
});
