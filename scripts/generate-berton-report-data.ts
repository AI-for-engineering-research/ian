#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..', 'code', 'cloud-rom');
const publicRoot = path.resolve(process.cwd(), 'public', 'data');

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

async function readCsv(relativePath: string): Promise<Record<string, string>[]> {
  return parseCsv(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function writeJson(relativePath: string, data: unknown): Promise<void> {
  const outputPath = path.join(publicRoot, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);
}

function number(value: string): number {
  return Number.parseFloat(value);
}

async function main(): Promise<void> {
  await writeJson('berton-symbolic-reduced-model/root-sweep.json', [
    { k: 1, mode: 'fast real', real: -1.0, imagAbs: 0 },
    { k: 1, mode: 'slow pair', real: -8.899119e-7, imagAbs: 2.372753e-4 },
    { k: 10, mode: 'fast real', real: -10.0, imagAbs: 0 },
    { k: 10, mode: 'slow pair', real: -9.152471e-7, imagAbs: 2.372752e-4 },
    { k: 100, mode: 'fast real', real: -100.0, imagAbs: 0 },
    { k: 100, mode: 'slow pair', real: -9.177806e-7, imagAbs: 2.372752e-4 },
    { k: 1000, mode: 'fast real', real: -1000.0, imagAbs: 0 },
    { k: 1000, mode: 'slow pair', real: -9.180340e-7, imagAbs: 2.372752e-4 },
    { k: 10000, mode: 'fast real', real: -10000.0, imagAbs: 0 },
    { k: 10000, mode: 'slow pair', real: -9.180593e-7, imagAbs: 2.372752e-4 },
  ]);

  const summary = await readCsv('episodes/05-full-model-oscillatory-orbit/outputs/task011/summary.csv');
  await writeJson('berton-auto-continuation/damped-envelope.json', summary.flatMap((row) => [
    { method: row.method, window: '150–200 h', amplitude_m: number(row.z_amp_150_200h_m) },
    { method: row.method, window: '450–500 h', amplitude_m: number(row.z_amp_450_500h_m) },
  ]));
  await writeJson('berton-auto-continuation/late-equilibrium-eigenvalues.json', (await readCsv('episodes/05-full-model-oscillatory-orbit/outputs/task011/eigenvalues.csv')).map((row) => ({
    eigenvalue: row.eigenvalue_index,
    real_s_inv: number(row.real_s_inv),
    imag_s_inv: number(row.imag_s_inv),
    period_h: row.period_h_if_complex ? number(row.period_h_if_complex) : null,
    e_folding_h: number(row.e_folding_h),
  })));

  const ha3 = await readCsv('episodes/10-full-model-python-continuation/outputs/task028/full_ha3_eigenvalues.csv');
  const ha3ByPoint = new Map<string, { run: string; H_a3: number; maxReal: number; complexPairReal?: number }>();
  for (const row of ha3) {
    const key = `${row.run}:${row.step_index}`;
    const current = ha3ByPoint.get(key) ?? { run: row.run, H_a3: number(row.H_a3), maxReal: Number.NEGATIVE_INFINITY };
    const real = number(row.real_s_inv);
    const imag = Math.abs(number(row.imag_s_inv));
    current.maxReal = Math.max(current.maxReal, real);
    if (imag > 1e-10) current.complexPairReal = real;
    ha3ByPoint.set(key, current);
  }
  await writeJson('berton-python-continuation/ha3-critical-eigenvalues.json', [...ha3ByPoint.values()].sort((a, b) => a.H_a3 - b.H_a3));

  const width = await readCsv('episodes/10-full-model-python-continuation/outputs/task032/width_summary.csv');
  await writeJson('berton-python-continuation/smoothing-width-conditioning.json', width.map((row) => ({
    smooth_width_m: number(row.smooth_width_m),
    z_W0_min_m: number(row.z_W0_min_m),
    z_W0_max_m: number(row.z_W0_max_m),
    accepted_points: number(row.accepted_points),
    max_state_jacobian_condition: number(row.max_state_jacobian_condition),
  })).sort((a, b) => a.smooth_width_m - b.smooth_width_m));

  const zw0 = await readCsv('episodes/10-full-model-python-continuation/outputs/task032/zw0_width_map_points.csv');
  await writeJson('berton-python-continuation/zw0-width-map.json', zw0.filter((row) => row.accepted === 'True').map((row) => ({
    z_W0_m: number(row.z_W0_m),
    smooth_width_m: number(row.smooth_width_m),
    state_jacobian_condition: number(row.state_jacobian_condition),
    critical_real_s_inv: number(row.critical_real_s_inv),
    critical_imag_s_inv: number(row.critical_imag_s_inv),
    in_transition_region: row.in_transition_region === 'True',
  })));
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
