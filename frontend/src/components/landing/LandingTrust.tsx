"use client";

export function LandingTrust() {
  return (
    <section id="trust" className="min-h-screen flex flex-col justify-center py-16 bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 lg:items-center w-full">
        {/* Left Side Content */}
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            Compliance & Security
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            Designed for Highest Medical Privacy Standards
          </h2>
          <p className="text-muted leading-relaxed">
            Patient health records are highly sensitive. Cannathera utilizes advanced end-to-end encryption protocols and structural isolation architectures to guarantee data protection.
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  verified_user
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">Art. 9 GDPR Compliance</h4>
                <p className="mt-1 text-sm text-muted">
                  Strictly patient-consented medical processing. Health details are isolated and only shared with treating physicians upon explicit release.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  lock
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">AES-256 Encryption</h4>
                <p className="mt-1 text-sm text-muted">
                  All databases are fully encrypted. Data packets are secure both in transit (TLS 1.3) and at rest.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  shield
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">Audit Logging</h4>
                <p className="mt-1 text-sm text-muted">
                  Full tracking transparency. Every system change, access instance, or data transfer creates a cryptographically signed audit log.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Trust Index Panel */}
        <div className="rounded-2xl border border-hairline bg-surface p-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sage-900 text-center">
            Security & Trust Assessment
          </h3>
          <div className="mt-6 flex flex-col items-center">
            {/* Simulated circular progress */}
            <div className="relative flex size-36 items-center justify-center rounded-full border-8 border-hairline">
              <div className="absolute inset-0 rounded-full border-8 border-pine-600 border-t-transparent border-r-transparent transform -rotate-45" />
              <div className="text-center">
                <span className="font-display text-4xl font-extrabold text-pine">92%</span>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">Trust Score</p>
              </div>
            </div>
            
            <p className="mt-6 flex items-center gap-2 font-bold text-pine-600">
              <span aria-hidden className="msym text-[20px]">
                verified
              </span>
              Identity & Compliance Verified
            </p>
            <p className="mt-2 text-xs text-muted text-center max-w-xs">
              Cryptographic systems audited against argon2id hashing, TLS 1.3 transmission, and MFA access control guidelines.
            </p>
          </div>

          <div className="mt-8 border-t border-hairline pt-6 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Standard</p>
              <p className="mt-1 font-mono text-sm font-bold text-ink-strong">TLS 1.3 / AES-256</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Hashing</p>
              <p className="mt-1 font-mono text-sm font-bold text-ink-strong">Argon2id</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
