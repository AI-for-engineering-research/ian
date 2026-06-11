---
name: extract-model
description: Extract a mathematical model from a scientific paper, especially atmospheric physics, and build a readable Python reference implementation with Pint units, paper-faithful symbols, tests, and examples. Use when asked to implement a model from a paper, PDF, LaTeX, Markdown, or pasted scientific text.
---

# Extract Model

Use this skill to turn a scientific paper's mathematical model into a Python reference implementation. Prioritize physical correctness, traceability to the paper, and legibility over performance or architectural polish.

## Core Principles

- Work in **two phases every time**:
  1. Extract and write an implementation specification.
  2. Pause for user review/clarification before implementing.
- Do **not** implement until the user explicitly confirms phase 2.
- Use `pint` for units of physical quantities.
- Preserve the paper's notation in code as closely as Python allows.
  - Greek identifiers are fine and encouraged: `ρ`, `κ`, `Ω`, etc.
  - Subscripts become underscores: `ρ_{ie}` -> `ρ_ie`.
  - Avoid unnecessarily long identifiers.
  - Add ASCII aliases only at public API boundaries if genuinely helpful.
- Keep dependencies lean. Acceptable defaults: `pint`, `numpy`, `pandas`, `xarray`, `scipy`, `matplotlib`.
- Prefer a literal, equation-by-equation reference implementation over vectorized or optimized code.
- Use comments and docstrings to map code back to paper equations, tables, sections, and assumptions.
- If NumPy or vectorization makes units or equations harder to verify, do not use it; add a comment explaining why.
- Use simple functions and lightweight dataclasses. Avoid protocols and class-heavy frameworks unless the target package already requires them.

## Phase 0: Intake and Normalization

1. Identify the source material:
   - PDF file path
   - LaTeX source
   - Markdown/plain text
   - HTML/DOCX or other source convertible by Pandoc
   - pasted excerpts
2. Check that Pandoc is available:

   ```bash
   pandoc --version
   ```

   If Pandoc is missing, stop and tell the user it is required for this skill.
3. Normalize the paper/source to Markdown with Pandoc where possible:
   - For `.tex`, `.md`, `.html`, `.docx`, etc., use Pandoc to produce a Markdown extraction file.
   - For PDFs, try Pandoc as a best effort, but do not assume it will preserve equations or tables well.
4. If conversion fails or output loses important equations/tables, stop and ask for better source material: LaTeX, publisher HTML, supplementary material, manually extracted equations/tables, or pasted relevant sections.

## Phase 1: Extraction Specification

Always write a Markdown spec file before implementation. Use an appropriate path in the target project, usually one of:

- `MODEL_EXTRACTION.md`
- `docs/MODEL_EXTRACTION.md`
- `docs/<model-name>-extraction.md`

If working inside an existing package, inspect project conventions first:

- `pyproject.toml`, `setup.cfg`, `setup.py`
- source/package layout
- test framework and test style
- examples/docs layout
- formatting/linting configuration

If no package exists, propose a minimal layout with `src/`, `tests/`, and `examples/`.

The phase-1 spec must include:

1. **Paper/source citation**
   - title, authors, year if available
   - source file/path/URL if available
2. **Implementation goal**
   - what model or submodel will be implemented
   - intended inputs and outputs
3. **Domain of validity and assumptions**
   - assumptions stated by the paper
   - assumptions inferred from implementation needs, clearly labeled
4. **Symbol table**
   - paper notation
   - Python identifier
   - units/dimensions
   - meaning
   - where defined in the paper
5. **Constants and parameters**
   - values, units, source table/equation
   - whether fixed, configurable, or unknown
6. **Equation inventory**
   - equation number or section reference
   - original mathematical expression when possible
   - plain-language meaning
   - proposed Python function/name
   - inputs, outputs, units
7. **Evaluation order / algorithm**
   - a step-by-step order matching the paper as closely as possible
8. **Numerical methods**
   - solvers, approximations, discretization, interpolation, convergence criteria, etc.
   - note anything unspecified by the paper
9. **Ambiguities / required user decisions**
   - missing constants
   - undefined symbols
   - unclear units
   - inconsistent equations
   - boundary/initial conditions
   - choices that would otherwise require guessing
10. **Proposed file layout**
    - implementation files
    - tests
    - examples/docs
11. **Test plan**
    - dimensional/unit tests
    - equation smoke tests
    - paper regression/reference tests if data exist
    - physical sanity tests only where justified
12. **Example plan**
    - minimal run
    - paper scenario, limiting case, or figure/table reproduction if possible

After writing the spec, stop and ask the user to review it, especially the ambiguities and required decisions. Do not proceed until the user confirms phase 2 and resolves blocking ambiguities.

## Handling Ambiguity

Be strict about gaps in the paper:

- Do not silently fill gaps from common knowledge unless clearly labeled as an assumption.
- If ambiguity blocks implementation, ask the user for clarification in phase 1.
- If implementation can proceed with placeholders, make them explicit using required parameters, documented TODOs, or `NotImplementedError`.
- Prefer exposing uncertain constants, closures, parameterizations, and boundary conditions as inputs.
- Never invent validation data or expected numerical results.

## Phase 2: Implementation

Proceed only after explicit user approval.

Implementation style:

- Use a flat module structure with functions and simple dataclasses.
- Prefer pure functions for equations.
- Provide one obvious high-level evaluation function plus lower-level equation functions.
- Keep parameters explicit and unit-bearing.
- Implement equations in the same order/structure as the paper where possible.
- Add comments such as `# Eq. (12)` at the corresponding code.
- Use docstrings for each public function with:
  - paper equation/section reference
  - expected units
  - returned units
  - assumptions/limitations
- Use lightweight type hints when they improve clarity.
  - Dataclasses are OK.
  - Protocols and elaborate generic abstractions are not.

### Units with Pint

Use `pint.UnitRegistry` and favor simplicity/legibility:

- Public APIs should accept and return Pint quantities where practical.
- Validate dimensionality at boundaries.
- Keep units visible in code so a reader can verify physical correctness.
- Avoid stripping to magnitudes unless it clearly improves readability and is documented.
- If using NumPy with Pint makes code harder to verify, avoid NumPy for that part and comment why.
- Optional xarray integration may be used if the target package already uses it, but do not require `pint-xarray` by default.

### Tests

Include tests as far as possible. Prefer `pytest` if the target project already uses it or if creating a new package.

Required test categories:

1. **Dimensional tests**
   - expected units accepted
   - incompatible units rejected
2. **Equation smoke tests**
   - simple hand-checkable values for individual equations/functions
3. **Reference/regression tests**
   - use paper tables, figures, examples, or limiting cases when available
4. **Physical sanity tests**
   - conservation, monotonicity, positivity, asymptotic behavior, etc., only when justified by the paper

If the paper lacks reference outputs, say so explicitly and avoid pretending smoke/sanity tests validate the whole model.

### Examples

Prefer plain Python scripts in `examples/` over notebooks by default.

Examples should:

- reproduce a paper scenario, table, figure, limiting case, or minimal run when possible
- include comments mapping inputs/outputs to paper sections/tables/figures
- use `matplotlib` only when plots help compare to the paper
- clearly label synthetic examples as non-validation

## Final Response Checklist

When phase 1 is complete, report:

- path to the extraction spec
- major ambiguities or required user decisions
- whether implementation is currently blocked
- exact confirmation needed to proceed

When phase 2 is complete, report:

- implementation files changed/created
- tests added and commands run
- examples added
- validation status against the paper
- remaining assumptions or risks
