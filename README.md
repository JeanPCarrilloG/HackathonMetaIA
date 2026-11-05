# HackathonMetaIA
It's a 13+ wellbeing diary based on PEI-GPI-DT that tracks 5 aspects of daily journaling: chronicle, emotional, relational, reflexive and projective. For both code and content, Meta AI was used as bibliography and reference, with all prompts, paraphrases and advice generated via Meta's Muse Wonder and Spark models through the Meta Model API.

# Wellbeing Diary - Global Privacy Compliant Reflective System
Meta Global Hackathon - Wellbeing Track

## 1. Research Problem and Design Rationale

The system addresses daily reflective journaling for adolescents 13+ under global privacy constraints (GDPR, COPPA, Ley 1581, Meta Child Safety Policies). The design hypothesis: a diary structured in five developmental dimensions (Chronicle, Emotional, Relational, Reflexive, Projective) increases reflective depth while maintaining data minimization and local-only persistence. The architecture avoids diagnostic classification, forensic claims, and persistent storage of sensitive disclosures. All storage is client-side per pseudonym.

## 2. Architecture - MVC Vanilla JS

Pattern: Model-View-Controller, no frameworks, 100% client-side.

Storage layer:
- AppConfig.js: Single source of truth. Keys: diary_user_{nick} for diary, prefs_{nick} for preferences, consent_13plus_{nick} for consent flag, users_registry_v3 for registry JSON, session_current_nick_v3 for active nick, temp_api_key_v3 for Meta API key in sessionStorage only. getCurrentDiaryKey() resolves per-nick diary key. isAuthenticated() checks nick + apiKey presence. clearSession() removes only sessionStorage. clearAllUserData(nick) removes all keys prefixed with nick.
- UserRegistryModel.js: Registry map {nick: {nick, age_range, created_at, loginCount}}. Methods: exists(nick), createUser(nick, age_range), getUser(nick), incrementLogin(nick), validateApiKey(key) (min 8 chars, no server validation).
- NickSessionModel.js: Handles creation and login. createAndLogin(nick, apiKey, age_range) validates key, creates registry entry, sets sessionStorage. login(nick, apiKey) requires exact match to existing nick (case-insensitive normalized [^a-z0-9_-]), increments loginCount, stores nick in both localStorage and sessionStorage. getCurrent() returns current session object with age_range and loginCount. logout() calls AppConfig.clearSession() and redirects to login.html.
- DiaryModel.js: Per-nick storage. diary = { ISOdate: { aspects: {chronicle, emotional, relational, reflexive, projective: bool}, entries: [{role, content, ts, edited}] } }. Methods: getDay(iso), getAllDates(), getAllEntriesFlat() sorted descending by ts, getFullDayConversation(iso) concatenates all entries for advice context, search(query) case-insensitive on content and date, markAspect(iso, aspect), addEntry(iso, role, content), editEntry(iso, index, newContent), deleteEntry(iso, index), getMissingAspects(iso), detectAspects(text) regex heuristics: chronicle school|home|family|work|class|today, emotional feel|felt|happy|sad|angry|worried, relational friend|family|mom|dad|together, reflexive because|learn|think|realize|why, projective tomorrow|next|want to|will|dream|future.
- ChatModel.js: Per-nick chat history wrapper over localStorage key diary_user_{nick}_chat. Methods getAll(), add(role, content), clear().
- DateManagerModel.js: Manages diary_date_global_v3. Methods getCurrentDate(), getISODate(), getFormattedDate(), nextDay(), prevDay(), getGreeting() based on hour <12 morning, <18 afternoon, else evening.
- WellbeingPrefsModel.js: Reads prefs_{nick} JSON, contains age_range and region_general.
- AnonymousSessionModel.js: Legacy compatibility, creates anon session id if needed, not used in nick flow.

View layer:
- ChatView.js: Renders history, filters risk-high|risk-medium roles, updates date label, progress badges, supportHint/profileHint.
- CalendarView.js: Renders calendarContainer with CalendarHeader prevM/nextM buttons, CalendarGrid 7-column, cal-day has-data selected classes, setViewDate(iso), click handler onDateSelect.
- DiaryReaderView.js: Renders list grouped by date, DateSeparator, edit/delete buttons, editModal with textarea, searchBar filtering.
- LoginView.js: Tab logic tabLoginBtn/tabCreateBtn, default showLogin(), handlers createUserBtn and loginBtn with validation, error display, disabled state during validation.
- IndexView.js: Logout binding.
- DashboardjsView.js: Stats calculation: totalDays = Object.keys(diary).filter(d => entries.length>0).length, totalEntries = loginCount. Renders usersBody row with UPPERCASE nick, age_range, days, entries. Modal system appModal with modes terms and deleteTest, openModal(mode) injects terms HTML compliant with global privacy principles, confirmModalBtn deletes all keys starting with diary_user_, prefs_, consent_13plus_, users_registry_v3, session_current_nick_v3 and clears sessionStorage.

Controller layer:
- ChatController.js: Init checks isAuthenticated(), sets UPPERCASE badge, loads current ISO day, renders greeting if day empty, binds Send/Previous/Next/Clear/Finish/Logout, Enter to send. Modal management: adviceModal, adviceModalBody, closeAdviceX, closeAdviceBtn, continueWritingBtn, isModalActive flag blocking send(), prevDay(), nextDay(). showAdviceModal(advice) logs [ALERT][MUSE WONDER GENERATED][MODAL][5 ASPECTS][WAITING USER] and [MUSE WONDER 1.0][ADVICE][RANDOM][RECOGNIZING DAY], displays flex, disables Send button. hideAdviceModal() restores focus. closeWithGoodbye() generates closing via QuestionGeneratorModel.getParaphrasedClosing(), logs [CHAT RESPONSE][CLOSING][X OR OUTSIDE]. continueWriting() generates next generic via getParaphrasedGeneric(), logs [CHAT RESPONSE][CONTINUE WRITING]. send() detects aspects, updates progress, adds user entry, calls wellbeingModel.assess(text) logging [WELLBEING BASE] and [MUSE WONDER ALERT], checks getMissingAspects(iso).length===0 then calls getFullDayConversation(iso) and getCompletionAdviceAsync(fullConv) for personalized advice, shows modal, returns without generating next question. Otherwise generates next question via getNextDiaryQuestion(iso).
- DiaryReaderController.js: Init loads all dates, renders calendar, shows current date, binds searchBar input to diaryModel.search(q), edit/delete handlers, saveEdit via editEntry.

## 3. AI Integration - Meta Muse Wonder 1.0

Endpoint: https://api.meta.ai/v1/responses
Model: muse-wonder-1.0
Reasoning: { effort: "medium" }

Request format (corrected from initial 400 Bad Request on /v1/chat/completions with messages):

```
fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: "muse-wonder-1.0",
    reasoning: { effort: "medium" },
    input: [{ role: "user", content: [{ type: "input_text", text: inputText }] }],
    stream: false,
    max_output_tokens: 400
  })
})
```

Response parsing: data.output_text || data.output?.[0]?.content?.[0]?.text, cleanup replace(/\s*\[[^\]]+\]\s*$/g, '') and replace(/\s*\d{3,6}\s*$/g, '') to remove [l30], [zn], [ai-...].

Models:
- QuestionGeneratorModel.js: Bases: greetings Good morning Ready to write..., Good afternoon How is..., Good evening Let's think... Diary questions per aspect map chronicle What happened today at school or home, emotional How did you feel inside today, relational Did you spend time with friends or family, reflexive Why do you think that happened, projective What do you want to do tomorrow. Generics Do you want to tell me something more. Closings 5 phrases Thanks for noting today You can return..., Appreciate your time writing Rest..., Your entry is saved See you..., Grateful for your reflection..., Thank you for this page The diary awaits.... Methods paraphrase(base, ctx) calls Wonder with random seed, getParaphrasedDiaryQuestion(aspect), getParaphrasedGeneric(), getParaphrasedClosing() with prompt rewriting related but different, getParaphrasedVerification(field, txt). Temperature 1.0 for uniqueness via random seed injection.
- WellbeingSignalModel.js: assess(text) local heuristic state stable/mild/needs_support, base suggestion, then generateWonderAlert(base, state, userText) via Wonder for unique variant logging [MUSE WONDER ALERT]. getCompletionAdviceAsync(fullDayConversation) generates personalized advice recognizing full day conversation: shortConv 900 chars, uniqueId Date.now+random, avoid previous advice, prompt includes Full day conversation, 2-3 sentences warm supportive actionable related to story, no prefix Daily advice, no codes. Retry loop 4 attempts if length<25 or seen before. Fallback localRelatedAdvice(fullDayConversation) extracts keywords 4+ letters, templates connecting keyword to 5 aspects, seenAdvice Set size 200, lastAdvice tracking. Logs [MUSE WONDER 1.0][ADVICE][RANDOM][RECOGNIZING DAY].

Logs implemented: [WELLBEING BASE], [MUSE WONDER ALERT], [MUSE WONDER 1.0][ALERT GENERATED], [ALERT][MUSE WONDER GENERATED][MODAL][5 ASPECTS][WAITING USER], [CHAT RESPONSE], [CHAT RESPONSE][CONTINUE WRITING][MUSE WONDER 1.0], [CHAT RESPONSE][CLOSING][X OR OUTSIDE][MUSE WONDER 1.0], [CHAT RESPONSE][CONTINUE WRITING].

## 4. Global Compliance Implementation

- Age gate: createAgeSelect values 13-15/16-18/18+ only, stored once at creation in registry, checkbox createTermsCheck required once.
- Nick normalization: trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0,20).
- No PII collection: No inputs for DOB exact, address, gender, sexual orientation. WellbeingPrefs only general region not-shared.
- Session management: API key in sessionStorage temp_api_key_v3, cleared on logout and Delete Test Data. Never persisted in localStorage.
- Per-nick isolation: Diary key diary_user_{nick}, prefs prefs_{nick}, consent consent_13plus_{nick}.
- Metrics: Dashboard Entries = loginCount incremented on create/login, Days = days with entries>0 via Object.keys(diary).filter(d => entries.length>0).
- Right to be forgotten: Delete Test Data modal confirms deletion of all prefixed keys plus registry and session keys, sessionStorage.clear(), redirect to login.
- Terms modal: Global Privacy Notice listing principles: 13+ only, nick only, access code local, age range, data minimization, local-only, 5-aspect advice, right to be forgotten, resources.

## 5. UI Specification Compliance

- index.html: Header with Logo, My Personal Diary, Date label, UserBadge UPPERCASE, HeaderActions Previous Day/Next Day Full English, Finish My Diary Chat, Clear History, Close Session/Logout, My Diary link, Dashboard link. Container history, dailyProgress badges done state, TextArea, PrimaryButton Send. adviceModal with title 5 Aspects Completed - Advice, body adviceModalBody, buttons Continue Writing Primary and Close Secondary plus X, display flex when show, background rgba 0,0,0,0.7. Per-page chat: model.history=[] cleared on loadDay, only current day shown. Input never permanently disabled, focus restored.
- diary.html: Top searchBar, calendarContainer with CalendarHeader prevM/nextM, CalendarGrid cal-day has-data selected, calendarDateInput YYYY/MM/DD + nativeDateIcon type date, selectedDateTitle, diaryList, editModal.
- dashboard.html: Header Dashboard - Wellbeing Global, UserBadge, HeaderActions Diary, Logout, Delete Test Data, statsContainer, badges Entries=Login Count Days=Days with entries>0, searchAlerts, table Nick/Age Range/Days/Entries, Terms and Conditions button after green info div, appModal custom not Bootstrap with modalTitle modalBody closeX closeModalBtn confirmModalBtn.
- login.html: LoginContainer, Logo, tabs Login/Create User, loginPanel with loginNickInput loginApiInput loginBtn, createPanel with createNickInput createApiInput createAgeSelect createTermsCheck createUserBtn, no dropdown of existing nicks, exact nick required.

## 6. File Structure Final V4

Public/CSS/Styles.css
Public/Js/Controllers/ChatController.js
Public/Js/Controllers/DiaryReaderController.js
Public/Js/Models/AnonymousSessionModel.js
Public/Js/Models/ChatModel.js
Public/Js/Models/DateManagerModel.js
Public/Js/Models/DiaryModel.js
Public/Js/Models/NickSessionModel.js
Public/Js/Models/QuestionGeneratorModel.js
Public/Js/Models/UserRegistryModel.js
Public/Js/Models/WellbeingPrefsModel.js
Public/Js/Models/WellbeingSignalModel.js
Public/Js/Views/CalendarView.js
Public/Js/Views/ChatView.js
Public/Js/Views/DashboardjsView.js
Public/Js/Views/DiaryReaderView.js
Public/Js/Views/IndexView.js
Public/Js/Views/LoginView.js
Public/Js/AppConfig.js
Public/Js/Main.js
Public/Media/Alert.svg
Public/Media/Logo.svg
dashboard.html
diary.html
index.html
login.html

## 7. Execution

Open login.html -> Create User -> Login exact nick + same API key -> index.html -> Write entries -> When getMissingAspects().length===0 modal appears indefinite -> Continue Writing generates next generic question via Wonder -> Close/X/outside generates closing via Wonder -> diary.html search/edit/delete -> dashboard.html stats and Terms modal -> Delete Test Data clears all test data.

## 8. Technical Bibliography - Meta AI

Meta AI (Muse Wonder 1.0) used as bibliography for both code and content: MVC boilerplate, AppConfig per-nick key generation, DiaryModel aspect detection regex, WellbeingSignalModel prompt engineering for personalized full-day advice, QuestionGeneratorModel paraphrase logic with random seed injection to ensure always different but related messages, response parsing for output_text, bracket cleanup regex, modal blocking logic with isModalActive, Dashboard stats calculation, Terms and Conditions global privacy text, greeting and diary question bases and closing bases.

All AI-generated messages are variant via Wonder, not static, with logging for traceability. No external datasets or third-party APIs. Meta Model API is sole AI source.