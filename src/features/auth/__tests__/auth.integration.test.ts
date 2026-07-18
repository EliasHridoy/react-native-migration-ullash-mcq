describe('Auth Integration', () => {
  const hasCredentials = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
  const runIfUrl = hasCredentials ? describe : describe.skip;

  runIfUrl('With Supabase Credentials', () => {
    it('rejects invalid credentials', async () => {
      const { authApi } = require('../api/auth.api');
      await expect(authApi.signInWithEmail('invalid@test.com', 'wrong')).rejects.toThrow();
    });
  });

  it('runs placeholder when credentials missing', () => {
    expect(true).toBe(true);
  });
});
