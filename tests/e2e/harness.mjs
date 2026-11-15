/**
 * ACTS Web E2E Test Harness
 * Lightweight, zero-dependency testing framework with Spec, TAP-13, and JSON reporters.
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new AssertionError(message, false, true);
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const msg = message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertZero(count, label = 'violations', items = []) {
  if (count !== 0) {
    const sample = items.slice(0, 3).map(i => typeof i === 'object' ? JSON.stringify(i) : String(i)).join('; ');
    const detail = sample ? ` (Sample: ${sample})` : '';
    throw new AssertionError(`Expected 0 ${label}, found ${count}${detail}`, count, 0);
  }
}

export function assertIncludes(haystack, needle, message) {
  if (typeof haystack === 'string' && !haystack.includes(needle)) {
    throw new AssertionError(message || `Expected string to include "${needle}"`, haystack, needle);
  }
  if (Array.isArray(haystack) && !haystack.includes(needle)) {
    throw new AssertionError(message || `Expected array to include item`, haystack, needle);
  }
}

export function assertMatches(text, regex, message) {
  if (!regex.test(text)) {
    throw new AssertionError(message || `Expected text to match pattern ${regex}`, text, regex.toString());
  }
}

export class TestRunner {
  constructor(options = {}) {
    this.options = {
      format: options.format || 'spec', // 'spec' | 'tap'
      json: options.json || false,
      tier: options.tier || 'all',
      feature: options.feature || null,
      skipBuild: options.skipBuild || false,
      ...options
    };
    this.tests = [];
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  register(tier, id, name, fn, metadata = {}) {
    this.tests.push({
      tier,
      id,
      name,
      fn,
      metadata
    });
  }

  async run() {
    this.startTime = Date.now();
    this.results = [];

    const filteredTests = this.tests.filter(t => {
      if (this.options.tier !== 'all' && String(t.tier) !== String(this.options.tier)) {
        return false;
      }
      if (this.options.feature && String(t.metadata.featureId) !== String(this.options.feature)) {
        return false;
      }
      return true;
    });

    if (this.options.format === 'tap') {
      console.log('TAP version 13');
      console.log(`1..${filteredTests.length}`);
    }

    let testIndex = 0;
    for (const test of filteredTests) {
      testIndex++;
      const start = Date.now();
      let passed = false;
      let error = null;
      let detail = null;

      try {
        const out = await test.fn({
          skipBuild: this.options.skipBuild
        });
        passed = true;
        detail = typeof out === 'string' ? out : 'OK';
      } catch (err) {
        passed = false;
        error = err.message || String(err);
      }
      const durationMs = Date.now() - start;

      const result = {
        index: testIndex,
        tier: test.tier,
        id: test.id,
        name: test.name,
        passed,
        durationMs,
        error,
        detail,
        metadata: test.metadata
      };
      this.results.push(result);

      if (this.options.format === 'tap') {
        const okStr = passed ? 'ok' : 'not ok';
        console.log(`${okStr} ${testIndex} - [Tier ${test.tier}] ${test.id} - ${test.name}`);
        if (!passed) {
          console.log(`  ---`);
          console.log(`  message: ${JSON.stringify(error)}`);
          console.log(`  duration_ms: ${durationMs}`);
          console.log(`  ...`);
        }
      }
    }

    this.endTime = Date.now();
    return this.getSummary();
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const durationMs = this.endTime ? this.endTime - this.startTime : 0;

    const tierBreakdown = {};
    for (let t = 1; t <= 4; t++) {
      const tierTests = this.results.filter(r => String(r.tier) === String(t));
      if (tierTests.length > 0) {
        tierBreakdown[`Tier ${t}`] = {
          total: tierTests.length,
          passed: tierTests.filter(r => r.passed).length,
          failed: tierTests.filter(r => !r.passed).length
        };
      }
    }

    return {
      total,
      totalChecks: total,
      passed,
      passedChecks: passed,
      failed,
      failedChecks: failed,
      durationMs,
      tierBreakdown,
      results: this.results,
      allPassed: total > 0 && failed === 0
    };
  }

  printSummary() {
    return this.printReport();
  }

  printReport() {
    const summary = this.getSummary();

    if (summary.total === 0) {
      console.error('Error: No test checks were executed!');
      process.exit(1);
    }

    if (this.options.json) {
      console.log(JSON.stringify(summary, null, 2));
      return summary.allPassed;
    }

    if (this.options.format === 'tap') {
      console.log(`\n# tests ${summary.total}`);
      console.log(`# pass  ${summary.passed}`);
      console.log(`# fail  ${summary.failed}`);
      return summary.allPassed;
    }

    // Default Spec Reporter
    console.log('\n================================================================');
    console.log('       ACTS WEB E2E TEST SUITE (DAYLIGHT THEME & ANTI-BOX)       ');
    console.log('================================================================\n');

    let currentTier = null;
    for (const r of this.results) {
      if (r.tier !== currentTier) {
        currentTier = r.tier;
        console.log(`\n--- Tier ${currentTier} ------------------------------------------------`);
      }
      const icon = r.passed ? '  ✓ PASS' : '  ✗ FAIL';
      const duration = `(${r.durationMs}ms)`;
      console.log(`${icon} [${r.id}] ${r.name} ${duration}`);
      if (!r.passed) {
        console.log(`         Error: ${r.error}`);
      } else if (r.detail && r.detail !== 'OK') {
        console.log(`         Info: ${r.detail}`);
      }
    }

    console.log('\n================================================================');
    console.log('                        TEST SUMMARY                            ');
    console.log('================================================================');
    for (const [tierName, stats] of Object.entries(summary.tierBreakdown)) {
      const status = stats.failed === 0 ? 'ALL PASSED' : `${stats.failed} FAILED`;
      console.log(`  ${tierName.padEnd(8)}: ${stats.passed}/${stats.total} passed [${status}]`);
    }
    console.log('----------------------------------------------------------------');
    console.log(`  Total Checks Executed : ${summary.total}`);
    console.log(`  Passed                : ${summary.passed}`);
    console.log(`  Failed                : ${summary.failed}`);
    console.log(`  Execution Time        : ${(summary.durationMs / 1000).toFixed(2)}s`);
    console.log('================================================================\n');

    if (summary.allPassed) {
      console.log('✓ RESULT: ALL E2E TEST CHECKS PASSED PERFECTLY!\n');
    } else {
      console.log(`✗ RESULT: ${summary.failed} CHECK(S) FAILED. See diagnostic details above.\n`);
    }

    return summary.allPassed;
  }
}
