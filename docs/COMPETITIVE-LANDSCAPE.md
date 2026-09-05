# Competitive landscape

Accessibility skill collections and accessibility automation repositories
already exist. This project does not claim category novelty or compete by
advertising the largest rule list.

Its focus is a closed evidence loop: reproduce a real state, collect stable
browser evidence, trace the responsible authored source, make a conservative
patch, replay the interaction, prove the target failure is gone without adding
serious regressions, and add a behavior test. Public broken/repaired fixtures
make those outcomes inspectable across agent hosts.

The differentiation is verification-first remediation, real interaction replay,
source-level patches, stable fingerprints, cross-agent portability, explicit
human-review boundaries, and public evaluation inputs. axe-core remains the
deterministic rule authority; human judgment and real assistive-technology work
remain visible rather than being converted into unsupported automation.
