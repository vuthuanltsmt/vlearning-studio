# VLearning Studio 1.0 Stable

## Release scope

This release freezes the feature set after V12.4C and turns the current project into a stable daily-use baseline.

### Authoring
- Multi-page lesson editor.
- Video per page.
- Seven interactive question types.
- Completion settings.
- Theme/design customization.
- Course Intro.
- Course Outro.
- Certificate customization and reusable certificate templates.

### Learner Preview
- Learner-centric player.
- Lesson outline.
- Resume learning progress.
- Locked/unlocked navigation rules.
- Dashboard of learning results.
- CSV report and print.
- Completion certificate.
- Course Intro and Course Outro.
- Review Mode that preserves the original score/result.

### SCORM 1.2
- SCORM package export with media and manifest.
- LMS score/status reporting.
- lesson_location and suspend_data resume support.
- Lesson outline.
- Responsive learner UI and fullscreen.
- Dashboard, report export, certificate.
- Course Intro / Course Outro.
- Review Mode without changing the stored score/result.

## Frozen release rule

Do not add new features directly to this baseline.
Before any future upgrade, make a full folder copy or use the app's project backup tools.

## Recommended daily-use mode

Build once with BUILD-PRODUCTION.cmd, then start with START-VLEARNING.cmd.
Use START-DEVELOPMENT.cmd only while editing source code.
