const MockIdentityProvider = require('./MockIdentityProvider');
const VeriffProviderAdapter = require('./VeriffProviderAdapter');
const SumsubProviderAdapter = require('./SumsubProviderAdapter');

/**
 * ProviderFactory
 * Factory resolving the active identity verification provider based on configuration.
 */
class ProviderFactory {
  static getProvider(providerName) {
    const selected = (providerName || process.env.IDENTITY_PROVIDER || 'MOCK').toUpperCase();

    if (selected === 'SUMSUB') {
      const adapter = new SumsubProviderAdapter();
      if (adapter.isConfigured()) {
        return adapter;
      }
      console.log('[IDENTITY VERIFICATION] Sumsub requested but credentials missing. Using Mock Provider for instant offline verification.');
      return new MockIdentityProvider();
    }

    if (selected === 'VERIFF') {
      const adapter = new VeriffProviderAdapter();
      if (adapter.isConfigured()) {
        return adapter;
      }
      console.log('[IDENTITY VERIFICATION] Veriff requested but credentials missing. Falling back to Mock Provider.');
      return new MockIdentityProvider();
    }

    return new MockIdentityProvider();
  }

}

module.exports = ProviderFactory;

