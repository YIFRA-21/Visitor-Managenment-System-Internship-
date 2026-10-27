const MockIdentityProvider = require('./MockIdentityProvider');
const VeriffProviderAdapter = require('./VeriffProviderAdapter');
const SumsubProviderAdapter = require('./SumsubProviderAdapter');

/**
 * ProviderFactory
 * Factory resolving the active identity verification provider based on configuration.
 */
class ProviderFactory {
  static getProvider(providerName) {
    const selected = (providerName || process.env.IDENTITY_PROVIDER || 'SUMSUB').toUpperCase();

    if (selected === 'SUMSUB') {
      return new SumsubProviderAdapter();
    }

    if (selected === 'VERIFF') {
      const adapter = new VeriffProviderAdapter();
      if (adapter.isConfigured()) {
        return adapter;
      }
      console.warn('[IDENTITY VERIFICATION] Veriff requested but credentials missing. Falling back to Mock Provider in non-production.');
    }

    return new MockIdentityProvider();
  }
}

module.exports = ProviderFactory;

