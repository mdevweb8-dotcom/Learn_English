import { useEffect, useState } from 'react';
import { downloadBackup, parseBackup } from './backup';

const STORAGE_KEY = 'arabic-english-app-v1';
const PASS_SCORE = 80;
const DAILY_GOAL = 20;
const ENERGY_MAX = 25;
const COURSE_UNITS = 26;
const COURSE_LESSONS = 130;
const LESSON_TITLES = ['تدريب الاستماع', 'تدريب التحدث', 'تدريب المحادثة', 'المفردات', 'مهمة'];
const FOCUS = ['listen', 'choice', 'context', 'vocab', 'tf'];

const UNITS = [
  {
    id: 'A1-1',
    topic: 'اللقاءات الأولى',
    words: [
      { en: 'Hello', ar: 'مرحباً', ex: 'Hello, my name is Sara.' },
      { en: 'Goodbye', ar: 'وداعاً', ex: 'Goodbye, see you tomorrow.' },
      { en: 'Please', ar: 'من فضلك', ex: 'Please sit down.' },
      { en: 'Thank you', ar: 'شكراً', ex: 'Thank you for the coffee.' },
      { en: 'Name', ar: 'اسم', ex: 'What is your name?' },
    ],
  },
  {
    id: 'A1-2',
    topic: 'من نحن',
    words: [
      { en: 'I', ar: 'أنا', ex: 'I am from Sudan.' },
      { en: 'You', ar: 'أنت', ex: 'You are my friend.' },
      { en: 'We', ar: 'نحن', ex: 'We are students.' },
      { en: 'From', ar: 'من', ex: 'I am from Egypt.' },
      { en: 'Where', ar: 'أين', ex: 'Where are you from?' },
    ],
  },
  {
    id: 'A1-3',
    topic: 'بيتي وأشيائي',
    words: [
      { en: 'House', ar: 'بيت', ex: 'This is my house.' },
      { en: 'Room', ar: 'غرفة', ex: 'My room is small.' },
      { en: 'Book', ar: 'كتاب', ex: 'I read a book at night.' },
      { en: 'Table', ar: 'طاولة', ex: 'The book is on the table.' },
      { en: 'Door', ar: 'باب', ex: 'Please close the door.' },
    ],
  },
  {
    id: 'A1-4',
    topic: 'حياتي اليومية',
    words: [
      { en: 'Morning', ar: 'صباح', ex: 'Good morning!' },
      { en: 'Night', ar: 'ليل', ex: 'Good night, Sara.' },
      { en: 'Work', ar: 'عمل', ex: 'I go to work by bus.' },
      { en: 'Today', ar: 'اليوم', ex: 'What do you do today?' },
      { en: 'Sleep', ar: 'ينام', ex: 'I sleep at eleven.' },
    ],
  },
  {
    id: 'A1-5',
    topic: 'الطعام والمقهى والطلب',
    words: [
      { en: 'Coffee', ar: 'قهوة', ex: 'I want a coffee, please.' },
      { en: 'Water', ar: 'ماء', ex: 'Can I have a glass of water?' },
      { en: 'Bread', ar: 'خبز', ex: 'The bread is fresh.' },
      { en: 'Menu', ar: 'قائمة الطعام', ex: 'Can I see the menu?' },
      { en: 'Bill', ar: 'الفاتورة', ex: 'Can I have the bill, please?' },
    ],
  },
];

const LESSONS = UNITS.flatMap((unit, unitIndex) => [
  ...LESSON_TITLES.map((prefix, index) => ({
    id: `${unit.id}-L${index + 1}`,
    unit,
    unitNumber: unitIndex + 1,
    index,
    title: `${prefix}: ${unit.topic} - الجزء ${index + 1}`,
  })),
  {
    id: `${unit.id}-TEST`,
    unit,
    unitNumber: unitIndex + 1,
    index: LESSON_TITLES.length,
    isTest: true,
    title: `اختبار الوحدة ${unitIndex + 1}: ${unit.topic}`,
  },
]);

const DEFAULT_STATE = {
  completed: {},
  xp: 0,
  streak: 0,
  lastStudy: '',
  daily: { date: '', xp: 0, attempts: 0 },
  profile: { name: 'متعلم', email: '' },
};

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  speaker: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-8-1 2-2 3-3 3 0-4-2-7-5-9 0 4-3 6-3 11 0 3 2 6 4 7 1 0 3 0 3 0z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3"/><path d="M17 6h3v2a3 3 0 0 1-3 3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
  close: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
};

const today = () => new Date().toLocaleDateString('en-CA');
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const normalize = (text) => String(text).toLowerCase().replace(/[.!?,]/g, '').replace(/\s+/g, ' ').trim();
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function makeQuestion(kind, word, pool) {
  const others = pool.filter((w) => w !== word);
  switch (kind) {
    case 'listen':
      return { kind, prompt: 'استمع واكتب الكلمة الإنجليزية', audio: word.en, answer: word.en };
    case 'choice':
      return {
        kind,
        prompt: word.en,
        label: 'اختر معنى الكلمة',
        audio: word.en,
        options: shuffle([word.ar, ...shuffle(others).slice(0, 3).map((w) => w.ar)]),
        answer: word.ar,
      };
    case 'context':
      return {
        kind,
        prompt: word.ex.replace(new RegExp(escapeRegExp(word.en), 'i'), '____'),
        label: 'أكمل الجملة بالكلمة الناقصة',
        audio: word.ex,
        answer: word.en,
      };
    case 'vocab':
      return { kind, prompt: word.ar, label: 'اكتب الكلمة الإنجليزية', answer: word.en };
    default: {
      const other = shuffle(others)[0] ?? word;
      const shown = Math.random() < 0.5 ? word.ar : other.ar;
      return {
        kind: 'tf',
        prompt: `هل معنى "${word.en}" هو "${shown}"؟`,
        answer: shown === word.ar,
      };
    }
  }
}

const UNIT_TEST_SIZE = 10;
function makeUnitTest(unit) {
  return Array.from({ length: UNIT_TEST_SIZE }, (_, i) => {
    const word = unit.words[(i + Math.floor(i / FOCUS.length)) % unit.words.length];
    return makeQuestion(FOCUS[i % FOCUS.length], word, unit.words);
  });
}

const isCorrect = (q, value) =>
  q.kind === 'choice' || q.kind === 'tf' ? value === q.answer : normalize(value) === normalize(q.answer);

const todayStats = (s) => (s.daily?.date === today() ? s.daily : { date: today(), xp: 0, attempts: 0 });

function recordStudy(s, xpGain) {
  const daily = todayStats(s);
  const streak = s.lastStudy === today() ? s.streak : s.lastStudy === yesterday() ? s.streak + 1 : 1;
  return {
    ...s,
    xp: s.xp + xpGain,
    streak,
    lastStudy: today(),
    daily: { date: today(), xp: daily.xp + xpGain, attempts: daily.attempts },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

function ProgressBar({ value, max, color = 'bg-[#1A6FA0]' }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Card({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#E6F1F8] text-[#1A6FA0]">
            <Icon name={icon} />
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-[#1A6FA0] text-white hover:bg-[#155a82]',
    secondary: 'bg-[#E6F1F8] text-[#1A6FA0] hover:bg-[#d8ebf6]',
    success: 'bg-[#22C55E] text-white hover:bg-[#16a34a]',
    danger: 'border border-[#EF4444] bg-white text-[#DC2626] hover:bg-red-50',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Quiz({ session, onFinish, onClose }) {
  const { title, questions, gated } = session;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = questions[index];
  const isText = ['listen', 'context', 'vocab'].includes(q.kind);
  const hasAnswer = value !== '';
  const passed = (score) => !gated || score >= PASS_SCORE;

  const check = () => {
    if (checked || !hasAnswer) return;
    setChecked(true);
    if (isCorrect(q, value)) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setValue('');
      setChecked(false);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setIndex(0);
    setValue('');
    setChecked(false);
    setCorrect(0);
    setFinished(false);
  };

  const score = Math.round((correct / questions.length) * 100);
  const result = { score, correct, passed: passed(score) };

  if (finished) {
    return (
      <Overlay title={title} onClose={onClose}>
        <div className="flex flex-col items-center px-6 pb-8 pt-6 text-center">
          <div className={`grid h-20 w-20 place-items-center rounded-full ${result.passed ? 'bg-green-50 text-[#22C55E]' : 'bg-red-50 text-[#EF4444]'}`}>
            <Icon name={result.passed ? 'trophy' : 'refresh'} className="h-9 w-9" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{result.passed ? 'أحسنت!' : 'لم تصل إلى نسبة النجاح'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {result.passed ? 'أنجزت هذا الجزء بنجاح.' : `تحتاج إلى ${PASS_SCORE}% للتقدم. راجع وحاول مرة أخرى.`}
          </p>
          <div className="mt-6 grid w-full grid-cols-3 gap-3">
            <Stat label="النتيجة" value={`${score}%`} />
            <Stat label="إجابات صحيحة" value={`${correct}/${questions.length}`} />
            <Stat label="XP" value={`+${correct * 2}`} />
          </div>
          <div className="mt-8 flex w-full flex-col gap-3">
            {!result.passed && (
              <Button variant="secondary" onClick={restart}>
                <Icon name="refresh" className="h-4 w-4" /> راجع وحاول مرة أخرى
              </Button>
            )}
            <Button onClick={() => onFinish(result)}>{result.passed ? 'متابعة' : 'إنهاء'}</Button>
          </div>
        </div>
      </Overlay>
    );
  }

  const audioText = q.audio;
  const showFeedback = checked;
  const correctLabel = q.kind === 'tf' ? (q.answer ? 'صح' : 'خطأ') : q.answer;

  return (
    <Overlay title={title} onClose={onClose}>
      <div className="px-5 pb-8 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>السؤال {index + 1} من {questions.length}</span>
        </div>
        <ProgressBar value={index} max={questions.length} color="bg-[#22C55E]" />

        <div className="mt-6 rounded-[20px] border border-[#E2E8F0] bg-white p-5 text-center shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          {q.label && <p className="text-sm font-bold text-[#1A6FA0]">{q.label}</p>}
          <p
            className="mt-3 text-2xl font-bold text-slate-900"
            dir={q.kind === 'vocab' || q.kind === 'tf' ? 'rtl' : 'ltr'}
          >
            {q.prompt}
          </p>
          {audioText && (
            <Button variant="secondary" className="mt-4" onClick={() => speak(audioText)}>
              <Icon name="speaker" className="h-4 w-4" /> استمع
            </Button>
          )}
        </div>

        <div className="mt-6">
          {isText && (
            <input
              dir="ltr"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={value}
              disabled={checked}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              placeholder="Type in English"
              className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-center text-lg text-slate-900 outline-none transition focus:border-[#1A6FA0] focus:ring-4 focus:ring-[#1A6FA0]/15 disabled:bg-slate-50"
            />
          )}

          {q.kind === 'choice' && (
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => (
                <OptionButton
                  key={opt}
                  selected={value === opt}
                  correct={checked && opt === q.answer}
                  wrong={checked && value === opt && opt !== q.answer}
                  disabled={checked}
                  onClick={() => setValue(opt)}
                >
                  {opt}
                </OptionButton>
              ))}
            </div>
          )}

          {q.kind === 'tf' && (
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((flag) => (
                <OptionButton
                  key={String(flag)}
                  selected={value === flag}
                  correct={checked && flag === q.answer}
                  wrong={checked && value === flag && flag !== q.answer}
                  disabled={checked}
                  onClick={() => setValue(flag)}
                >
                  {flag ? 'صح' : 'خطأ'}
                </OptionButton>
              ))}
            </div>
          )}
        </div>

        {showFeedback && (
          <div
            role="status"
            className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
              isCorrect(q, value) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {isCorrect(q, value) ? 'أحسنت! الإجابة صحيحة' : (
              <>
                الإجابة الصحيحة: <span dir="ltr">{correctLabel}</span>
              </>
            )}
          </div>
        )}

        <div className="mt-8">
          {checked ? (
            <Button className="w-full" onClick={next}>
              {index + 1 < questions.length ? 'التالي' : 'عرض النتيجة'}
            </Button>
          ) : (
            <Button className="w-full" onClick={check} disabled={!hasAnswer}>
              تحقق
            </Button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

function OptionButton({ selected, correct, wrong, disabled, onClick, children }) {
  let style = 'border-[#E2E8F0] bg-white text-slate-900 hover:border-[#1A6FA0]';
  if (correct) style = 'border-[#22C55E] bg-green-50 text-green-700';
  else if (wrong) style = 'border-[#EF4444] bg-red-50 text-red-600';
  else if (selected) style = 'border-[#1A6FA0] bg-[#E6F1F8] text-[#155a82]';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3 text-base font-bold transition duration-200 disabled:cursor-default ${style}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-slate-50 p-3">
      <div className="text-lg font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Overlay({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8FAFC]">
      <div className="mx-auto min-h-screen max-w-[480px] bg-[#F8FAFC]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
          >
            <Icon name="close" />
          </button>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <span className="w-10" />
        </header>
        {children}
      </div>
    </div>
  );
}

function TopHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 px-4 py-4 text-center backdrop-blur">
      <h1 className="text-lg font-bold text-slate-900">اللغة العربية والإنجليزية</h1>
    </header>
  );
}

function BottomNav({ tab, onChange }) {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: 'home' },
    { id: 'lessons', label: 'الدروس', icon: 'book' },
    { id: 'premium', label: 'بريميوم', icon: 'crown' },
    { id: 'account', label: 'الحساب', icon: 'user' },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E2E8F0] bg-white px-2 pb-3 pt-2">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-full py-2 text-xs font-bold transition duration-200 ${
                active ? 'bg-[#E6F1F8] text-[#1A6FA0]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeScreen({ nextLesson, daily, energy, streak, onContinue, onReview }) {
  const energyMessage = energy >= 15 ? 'جيدة - جاهز لجلسة تعلم جديدة' : 'منخفضة - خذ استراحة قصيرة';
  return (
    <div className="space-y-4">
      <Card
        title="متابعة الدرس التالي"
        subtitle={nextLesson ? `الوحدة ${nextLesson.unitNumber}: ${nextLesson.unit.topic}` : 'أكملت كل الدروس المتاحة حتى الآن'}
        icon="play"
      >
        {nextLesson && <p className="mb-4 text-sm font-bold text-slate-800">{nextLesson.title}</p>}
        <Button className="w-full" disabled={!nextLesson} onClick={onContinue}>
          متابعة
        </Button>
      </Card>

      <Card title="مراجعة اليوم" subtitle="5 أسئلة - 1-2 دقيقة - مجاناً" icon="refresh">
        <Button variant="secondary" className="w-full" onClick={onReview}>
          ابدأ المراجعة
        </Button>
      </Card>

      <Card title="الهدف اليومي: 20 XP" subtitle={`${daily.xp}/${DAILY_GOAL} XP`} icon="bolt">
        <ProgressBar value={daily.xp} max={DAILY_GOAL} />
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span className="flex items-center gap-1 font-bold text-orange-500">
            <Icon name="flame" className="h-4 w-4" /> سلسلة {streak} يوم
          </span>
          <span>إجمالي XP: {daily.total}</span>
        </div>
      </Card>

      <Card title="الطاقة" subtitle={`${energy}/${ENERGY_MAX} - ${energyMessage}`} icon="bolt">
        <ProgressBar value={energy} max={ENERGY_MAX} color="bg-[#22C55E]" />
      </Card>
    </div>
  );
}

function LessonsScreen({ lessons, openUnitId, onToggleUnit, onStart }) {
  const completedAll = lessons.filter((l) => l.state === 'done').length;
  const percent = Math.round((completedAll / COURSE_LESSONS) * 100);
  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">المستوى A1 - أساسي</h2>
            <p className="mt-1 text-sm text-slate-600">{completedAll} دروس مكتملة</p>
          </div>
          <span className="rounded-full bg-[#1A6FA0] px-3 py-1 text-sm font-bold text-white">A1</span>
        </div>
        <div className="mt-4">
          <ProgressBar value={completedAll} max={lessons.length} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{percent}% من الدورة</p>
      </section>

      {UNITS.map((unit, unitIndex) => {
        const unitLessons = lessons.filter((l) => l.unit.id === unit.id);
        const done = unitLessons.filter((l) => l.state === 'done').length;
        const unitLocked = unitLessons[0].state === 'locked';
        const unitDone = done === unitLessons.length;
        const open = openUnitId === unit.id;
        return (
          <section key={unit.id} className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
            <button
              type="button"
              onClick={() => onToggleUnit(unit.id)}
              className="flex w-full items-center gap-3 p-4 text-start transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <h3 className={`text-base font-bold ${unitLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                  الوحدة {unitIndex + 1}: {unit.topic}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{done}/{unitLessons.length} دروس</p>
                <div className="mt-2">
                  <ProgressBar value={done} max={unitLessons.length} color={unitDone ? 'bg-[#22C55E]' : 'bg-[#1A6FA0]'} />
                </div>
              </div>
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                  unitDone ? 'bg-green-50 text-[#22C55E]' : unitLocked ? 'bg-slate-100 text-slate-400' : 'bg-[#E6F1F8] text-[#1A6FA0]'
                }`}
              >
                <Icon name={unitDone ? 'check' : unitLocked ? 'lock' : 'book'} />
              </div>
              <Icon name="chevron" className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
            </button>

            {open && (
              <ul className="space-y-2 border-t border-[#E2E8F0] p-3">
                {unitLessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} onStart={onStart} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, onStart }) {
  if (lesson.state === 'locked') {
    return (
      <li className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500">
          <Icon name="lock" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-500">{lesson.title}</p>
          <p className="text-xs text-slate-500">أكمل السابق للفتح</p>
        </div>
      </li>
    );
  }
  const done = lesson.state === 'done';
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? 'bg-green-50 text-[#22C55E]' : 'bg-[#1A6FA0] text-white'}`}>
        <Icon name={done ? 'check' : 'play'} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
        <p className="text-xs text-slate-500">{done ? `النتيجة: ${lesson.score}%` : lesson.isTest ? '10 أسئلة' : '5 كلمات'}</p>
      </div>
      <Button variant={done ? 'secondary' : 'primary'} className="shrink-0 px-3 py-2" onClick={() => onStart(lesson)}>
        {done ? 'أعد' : 'ابدأ'}
      </Button>
    </li>
  );
}

function PremiumScreen({ onUpgrade }) {
  const features = ['خطط دراسة مخصصة', 'اختبارات المستوى النهائية', 'تحميل الدروس دون اتصال', 'تحليل نطقك بالتفصيل', 'مراجعة ذكية غير محدودة', 'شهادات إتمام المستويات'];
  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E6F1F8] text-[#1A6FA0]">
          <Icon name="crown" className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">بريميوم</h2>
        <p className="mt-2 text-sm text-slate-600">افتح كل ميزات التعلم المتقدمة وتعلم بسرعة أكبر.</p>
        <Button className="mt-5 w-full" onClick={onUpgrade}>ترقية إلى بريميوم</Button>
      </section>
      <Card title="ميزات بريميوم" icon="lock">
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
              <Icon name="lock" className="h-4 w-4 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function AccountInsights({ lessons }) {
  const passed = lessons.filter((l) => l.state === 'done');
  const testsPassed = passed.filter((l) => l.isTest).length;
  const average = passed.length ? Math.round(passed.reduce((sum, l) => sum + l.score, 0) / passed.length) : 0;
  const next = lessons.find((l) => l.state === 'open');
  const level = testsPassed === 0 ? 'مبتدئ' : testsPassed < UNITS.length ? 'في الطريق' : 'مكتمل';
  return (
    <>
      <Card title="أنت واقف وين" subtitle={next ? `الخطوة التالية: ${next.title}` : 'أنهيت كل الدروس المتاحة'} icon="flame">
        <ul className="space-y-2">
          {UNITS.map((unit, unitIndex) => {
            const unitLessons = lessons.filter((l) => l.unit.id === unit.id);
            const test = unitLessons.find((l) => l.isTest);
            const doneCount = unitLessons.filter((l) => l.state === 'done').length;
            const status = test.state === 'done' ? 'مكتملة' : unitLessons[0].state === 'locked' ? 'مغلقة' : 'جارية';
            return (
              <li key={unit.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-800">الوحدة {unitIndex + 1}: {unit.topic}</span>
                <span className="shrink-0 text-xs text-slate-500">{doneCount}/{unitLessons.length} - {status}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="مستواك كم" subtitle={`المستوى A1 - ${level}`} icon="trophy">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="دروس مكتملة" value={passed.length - testsPassed} />
          <Stat label="اختبارات الوحدات" value={`${testsPassed}/${UNITS.length}`} />
          <Stat label="متوسط النتائج" value={`${average}%`} />
        </div>
      </Card>
    </>
  );
}

function AccountScreen({ profile, lessons, completedCount, percent, onSaveProfile, onReset, onExport, onImport }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const initial = (profile.name || 'م').trim().charAt(0);

  const save = (e) => {
    e.preventDefault();
    onSaveProfile({ name: draft.name.trim() || 'متعلم', email: draft.email.trim() });
    setEditing(false);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) file.text().then(onImport, () => onImport(''));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#1A6FA0] text-2xl font-bold text-white">{initial}</div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">{profile.name}</h2>
            <p className="truncate text-sm text-slate-500" dir="ltr">{profile.email || 'أضف بريدك الإلكتروني'}</p>
          </div>
          <Button variant="secondary" className="px-3 py-2" onClick={() => { setDraft(profile); setEditing(!editing); }}>
            <Icon name="edit" className="h-4 w-4" /> تعديل
          </Button>
        </div>
        {editing && (
          <form onSubmit={save} className="mt-4 space-y-3">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="الاسم"
              maxLength={40}
              className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-slate-900 outline-none focus:border-[#1A6FA0]"
            />
            <input
              dir="ltr"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-slate-900 outline-none focus:border-[#1A6FA0]"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setEditing(false)}>إلغاء</Button>
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        )}
      </section>

      <Card title="ملخص الدورة" subtitle="الإنجليزية - أساسي" icon="book">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">الوحدات</dt><dd className="font-bold">{COURSE_UNITS}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">الدروس</dt><dd className="font-bold">{COURSE_LESSONS}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">مكتمل</dt><dd className="font-bold">{completedCount}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">التقدم</dt><dd className="font-bold">{percent}%</dd></div>
        </dl>
        <div className="mt-4">
          <ProgressBar value={completedCount} max={COURSE_LESSONS} />
        </div>
      </Card>

      <AccountInsights lessons={lessons} />

      <Card title="نسخة احتياطية" subtitle="حمّل تقدمك كملف، أو استعده من ملف سابق." icon="check">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onExport}>تصدير التقدم</Button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-[#E6F1F8] px-4 py-3 text-sm font-bold text-[#1A6FA0] transition duration-200 hover:bg-[#d8ebf6]">
            استيراد التقدم
            <input type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
          </label>
        </div>
      </Card>

      <Card title="إعادة تعيين التقدم" subtitle="يحذف كل الدروس المكتملة والنقاط على هذا الجهاز.">
        <Button variant="danger" className="w-full" onClick={onReset}>إعادة تعيين التقدم</Button>
      </Card>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('home');
  const [quiz, setQuiz] = useState(null);
  const [openUnitId, setOpenUnitId] = useState(UNITS[0].id);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (text) => setToast({ text, id: Date.now() });
  const isPassed = (id) => (state.completed[id] ?? 0) >= PASS_SCORE;

  const lessons = LESSONS.map((lesson, i) => {
    const done = isPassed(lesson.id);
    const unlocked = i === 0 || isPassed(LESSONS[i - 1].id);
    return { ...lesson, state: done ? 'done' : unlocked ? 'open' : 'locked', score: state.completed[lesson.id] ?? 0 };
  });
  const nextLesson = lessons.find((l) => l.state === 'open') ?? null;
  const daily = todayStats(state);
  const streak = state.lastStudy === today() || state.lastStudy === yesterday() ? state.streak : 0;
  const energy = Math.max(0, ENERGY_MAX - daily.attempts);
  const completedCount = lessons.filter((l) => l.state === 'done').length;
  const percent = Math.round((completedCount / COURSE_LESSONS) * 100);

  const startLesson = (lesson) => {
    setState((s) => ({ ...s, daily: { ...todayStats(s), attempts: todayStats(s).attempts + 1 } }));
    setQuiz({
      title: lesson.title,
      lessonId: lesson.id,
      gated: true,
      questions: lesson.isTest
        ? makeUnitTest(lesson.unit)
        : lesson.unit.words.map((w) => makeQuestion(FOCUS[lesson.index], w, lesson.unit.words)),
    });
  };

  const startReview = () => {
    const doneUnits = UNITS.filter((u) => lessons.some((l) => l.unit.id === u.id && l.state === 'done'));
    if (doneUnits.length === 0) {
      notify('أكمل درساً أولاً لتبدأ المراجعة');
      return;
    }
    const pool = shuffle(doneUnits.flatMap((u) => u.words.map((w) => ({ word: w, unit: u }))));
    const picks = pool.slice(0, 5);
    setQuiz({
      title: 'مراجعة اليوم',
      gated: false,
      questions: picks.map((p, i) => makeQuestion(FOCUS[i], p.word, p.unit.words)),
    });
  };

  const finishQuiz = (result) => {
    const lessonId = quiz.lessonId;
    const gained = result.correct * 2;
    setQuiz(null);
    setState((s) => {
      const next = recordStudy(s, gained);
      if (lessonId && result.passed) {
        next.completed = { ...s.completed, [lessonId]: Math.max(result.score, s.completed[lessonId] ?? 0) };
      }
      return next;
    });
    if (lessonId && result.passed) notify('أحسنت! تم فتح الدرس التالي');
  };

  const importProgress = (text) => {
    try {
      const data = parseBackup(text);
      setState((s) => ({ ...s, ...data }));
      notify('تم استيراد التقدم بنجاح');
    } catch {
      notify('الملف غير صالح');
    }
  };

  const continueLesson = () => {
    if (nextLesson) startLesson(nextLesson);
  };

  const screen = {
    home: (
      <HomeScreen
        nextLesson={nextLesson}
        daily={{ ...daily, total: state.xp }}
        energy={energy}
        streak={streak}
        onContinue={continueLesson}
        onReview={startReview}
      />
    ),
    lessons: (
      <LessonsScreen
        lessons={lessons}
        openUnitId={openUnitId}
        onToggleUnit={(id) => setOpenUnitId(openUnitId === id ? null : id)}
        onStart={startLesson}
      />
    ),
    premium: <PremiumScreen onUpgrade={() => notify('الاشتراك المدفوع غير متاح بعد')} />,
    account: (
      <AccountScreen
        profile={state.profile}
        completedCount={completedCount}
        percent={percent}
        lessons={lessons}
        onExport={() => downloadBackup(state)}
        onImport={importProgress}
        onSaveProfile={(profile) => {
          setState((s) => ({ ...s, profile }));
          notify('تم حفظ بيانات الحساب');
        }}
        onReset={() => {
          if (!window.confirm('هل تريد إعادة تعيين كل التقدم؟ لا يمكن التراجع عن هذا.')) return;
          setState((s) => ({ ...DEFAULT_STATE, profile: s.profile }));
          notify('تمت إعادة تعيين التقدم');
        }}
      />
    ),
  };

  const titles = { home: 'الرئيسية', lessons: 'الدروس', premium: 'بريميوم', account: 'الحساب' };

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-[#F8FAFC] pb-28 text-slate-900" dir="rtl">
      <TopHeader />
      <main className="px-4 pt-5">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{titles[tab]}</h2>
        {screen[tab]}
      </main>
      <BottomNav tab={tab} onChange={setTab} />

      {quiz && (
        <Quiz key={quiz.title + (quiz.lessonId ?? '') + quiz.questions.length} session={quiz} onFinish={finishQuiz} onClose={() => setQuiz(null)} />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
