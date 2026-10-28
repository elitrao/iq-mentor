import test from 'node:test';
import assert from 'node:assert/strict';
import { isReportCustdevPath, reportCustdevRoute } from '../src/report-custdev-navigation.js';

test('only the exact custdev path and its trailing slash select the standalone report page', () => {
  for (const path of ['/reportcustdev', '/reportcustdev/']) assert.equal(isReportCustdevPath(path), true);
  for (const path of ['/', '/bonus', '/reportcustdev-other', '/reportcustdev/settings']) assert.equal(isReportCustdevPath(path), false);
});
test('report links are reloadable while unrelated hashes stay within the two-report scope', () => {
  assert.equal(reportCustdevRoute('#category-report'), 'category-report');
  assert.equal(reportCustdevRoute('#summary-report'), 'summary-report');
  for (const hash of ['', '#settings', '#home', '#analytics']) assert.equal(reportCustdevRoute(hash), 'summary-report');
});
