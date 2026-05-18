import { LocaleString } from '@/types/schemas/locale-schemas';

import { LanguageCode } from './locale.service';

export const AppMessages = {
  /// Blank
  blank: {
    [LanguageCode.en]: '',
    [LanguageCode.ru]: '',
    [LanguageCode.by]: '',
  },

  /// Authentication
  'auth.signup.title': {
    [LanguageCode.en]: 'Create new account',
    [LanguageCode.ru]: 'Создать новый аккаунт',
    [LanguageCode.by]: 'Стварыць новы рахунак',
  },
  'auth.signin.title': {
    [LanguageCode.en]: 'Sign in with existing account',
    [LanguageCode.ru]: 'Войти в существующий аккаунт',
    [LanguageCode.by]: 'Увайсці ў існуючы рахунак',
  },
  'auth.form.email': {
    [LanguageCode.en]: 'Email Address',
    [LanguageCode.ru]: 'Электронная почта',
    [LanguageCode.by]: 'Электронная пошта',
  },
  'auth.form.password': {
    [LanguageCode.en]: 'Password',
    [LanguageCode.ru]: 'Пароль',
    [LanguageCode.by]: 'Пароль',
  },
  'auth.form.confirm-password': {
    [LanguageCode.en]: 'Confirm Password',
    [LanguageCode.ru]: 'Подтвердите пароль',
    [LanguageCode.by]: 'Пацвердзіце пароль',
  },
  'auth.form.username': {
    [LanguageCode.en]: 'Username',
    [LanguageCode.ru]: 'Имя пользователя',
    [LanguageCode.by]: 'Імя карыстальніка',
  },
  'auth.signup.success': {
    [LanguageCode.en]: 'Account created successfully! Welcome.',
    [LanguageCode.ru]: 'Аккаунт успешно создан! Добро пожаловать.',
    [LanguageCode.by]: 'Рахунак паспяхова створаны! Сардэчна запрашаем.',
  },
  'auth.signin.success': {
    [LanguageCode.en]: 'Successfully signed in.',
    [LanguageCode.ru]: 'Вы успешно вошли в систему.',
    [LanguageCode.by]: 'Вы паспяхова ўвайшлі ў сістэму.',
  },

  /// library
  'library.title': {
    [LanguageCode.en]: 'Topics',
    [LanguageCode.ru]: 'Темы',
    [LanguageCode.by]: 'Тэмы',
  },
  'library.description': {
    [LanguageCode.en]: 'Mixed questions and steady progress, topic by topic.',
    [LanguageCode.ru]: 'Смешанные вопросы и стабильный прогресс по темам.',
    [LanguageCode.by]: 'Змешаныя пытанні і стабільны прагрэс па тэмах.',
  },
  'library.section.start': {
    [LanguageCode.en]: 'Pick one to start',
    [LanguageCode.ru]: 'Выберите, с чего начать',
    [LanguageCode.by]: 'Абярыце, з чаго пачаць',
  },
  'library.section.continue': {
    [LanguageCode.en]: 'Recently practiced',
    [LanguageCode.ru]: 'Недавно практиковались',
    [LanguageCode.by]: 'Нядаўна практыкаваліся',
  },
  'library.section.explore': {
    [LanguageCode.en]: 'Discover more',
    [LanguageCode.ru]: 'Больше тем',
    [LanguageCode.by]: 'Больш тэм',
  },
  'library.loadingMore': {
    [LanguageCode.en]: 'Loading more topics',
    [LanguageCode.ru]: 'Загружаем больше тем',
    [LanguageCode.by]: 'Загружаем больш тэм',
  },
  'library.card.questions': {
    [LanguageCode.en]: 'Questions',
    [LanguageCode.ru]: 'Вопросы',
    [LanguageCode.by]: 'Пытанні',
  },
  'library.widget.all.title': {
    [LanguageCode.en]: 'All Exercises',
    [LanguageCode.ru]: 'Все упражнения',
    [LanguageCode.by]: 'Усе практыкаванні',
  },
  'library.widget.all.description': {
    [LanguageCode.en]: 'Practice with all available question types in this topic.',
    [LanguageCode.ru]: 'Практикуйтесь со всеми доступными типами вопросов в этой теме.',
    [LanguageCode.by]: 'Практыкуйцеся з усімі даступнымі тыпамі пытанняў у гэтай тэме.',
  },
  'library.filter.label': {
    [LanguageCode.en]: 'Discover filters',
    [LanguageCode.ru]: 'Фильтры для тем',
    [LanguageCode.by]: 'Фільтры для тэм',
  },
  'library.filter.description': {
    [LanguageCode.en]: 'Narrow the discover list by widget, level, or topic name.',
    [LanguageCode.ru]: 'Сужайте список тем по виджету, уровню или названию темы.',
    [LanguageCode.by]: 'Звужайце спіс тэм па віджэце, узроўні або назве тэмы.',
  },
  'library.filter.expand': {
    [LanguageCode.en]: 'Show filters',
    [LanguageCode.ru]: 'Показать фильтры',
    [LanguageCode.by]: 'Паказаць фільтры',
  },
  'library.filter.collapse': {
    [LanguageCode.en]: 'Hide filters',
    [LanguageCode.ru]: 'Скрыть фильтры',
    [LanguageCode.by]: 'Схаваць фільтры',
  },
  'library.filter.summary.widget': {
    [LanguageCode.en]: 'Filter:',
    [LanguageCode.ru]: 'Фильтр:',
    [LanguageCode.by]: 'Фільтр:',
  },
  'library.filter.summary.level': {
    [LanguageCode.en]: 'Level:',
    [LanguageCode.ru]: 'Уровень:',
    [LanguageCode.by]: 'Узровень:',
  },
  'library.filter.summary.search': {
    [LanguageCode.en]: 'Search by:',
    [LanguageCode.ru]: 'Поиск:',
    [LanguageCode.by]: 'Пошук:',
  },
  'library.filter.widgetLabel': {
    [LanguageCode.en]: 'Widget type',
    [LanguageCode.ru]: 'Тип виджета',
    [LanguageCode.by]: 'Тып віджэта',
  },
  'library.filter.levelLabel': {
    [LanguageCode.en]: 'Topic level',
    [LanguageCode.ru]: 'Уровень темы',
    [LanguageCode.by]: 'Узровень тэмы',
  },
  'library.filter.option.levelAll': {
    [LanguageCode.en]: 'All levels',
    [LanguageCode.ru]: 'Все уровни',
    [LanguageCode.by]: 'Усе ўзроўні',
  },
  'library.search.label': {
    [LanguageCode.en]: 'Search by topic name',
    [LanguageCode.ru]: 'Поиск по названию темы',
    [LanguageCode.by]: 'Пошук па назве тэмы',
  },
  'library.search.placeholder': {
    [LanguageCode.en]: 'Start typing a topic name',
    [LanguageCode.ru]: 'Начните вводить название темы',
    [LanguageCode.by]: 'Пачніце ўводзіць назву тэмы',
  },
  'library.filter.option.all': {
    [LanguageCode.en]: 'All widgets',
    [LanguageCode.ru]: 'Все виджеты',
    [LanguageCode.by]: 'Усе віджэты',
  },
  'library.filter.option.quiz': {
    [LanguageCode.en]: 'Quiz',
    [LanguageCode.ru]: 'Квиз',
    [LanguageCode.by]: 'Квіз',
  },
  'library.filter.option.trueFalse': {
    [LanguageCode.en]: 'True / False',
    [LanguageCode.ru]: 'Верно / Неверно',
    [LanguageCode.by]: 'Праўда / Няпраўда',
  },
  'library.filter.option.codeCompletion': {
    [LanguageCode.en]: 'Code Completion',
    [LanguageCode.ru]: 'Заполнение кода',
    [LanguageCode.by]: 'Дапаўненне кода',
  },
  'library.filter.option.flipCard': {
    [LanguageCode.en]: 'Flip Card',
    [LanguageCode.ru]: 'Флип-карта',
    [LanguageCode.by]: 'Фліп-карта',
  },
  'library.filter.option.bigO': {
    [LanguageCode.en]: 'Big O',
    [LanguageCode.ru]: 'Big O',
    [LanguageCode.by]: 'Big O',
  },
  'library.filter.option.codeOrdering': {
    [LanguageCode.en]: 'Code Ordering',
    [LanguageCode.ru]: 'Порядок кода',
    [LanguageCode.by]: 'Парадак кода',
  },
  'library.filter.option.asyncSorter': {
    [LanguageCode.en]: 'Async Code Sorter',
    [LanguageCode.ru]: 'Сортировщик асинхронного кода',
    [LanguageCode.by]: 'Сартыроўшчык асінхроннага кода',
  },
  'library.empty.title': {
    [LanguageCode.en]: 'No matching topics yet',
    [LanguageCode.ru]: 'Подходящих тем пока нет',
    [LanguageCode.by]: 'Падыходных тэм пакуль няма',
  },
  'library.empty.description.default': {
    [LanguageCode.en]: 'No topics are available to explore yet.',
    [LanguageCode.ru]: 'Пока нет тем для изучения.',
    [LanguageCode.by]: 'Пакуль няма тэм для вывучэння.',
  },
  'library.empty.description.filtered': {
    [LanguageCode.en]: 'Try adjusting the widget, level, or search filters.',
    [LanguageCode.ru]: 'Попробуйте изменить виджет, уровень или поисковый запрос.',
    [LanguageCode.by]: 'Паспрабуйце змяніць віджэт, узровень або пошукавы запыт.',
  },

  /// dashboard
  'dashboard.startPracticeButton': {
    [LanguageCode.en]: 'Start Practice',
    [LanguageCode.ru]: 'Начать практику',
    [LanguageCode.by]: 'Пачаць практыку',
  },
  'dashboard.activity.title': {
    [LanguageCode.en]: 'Daily user activity',
    [LanguageCode.ru]: 'Ежедневная активность пользователя',
    [LanguageCode.by]: 'Штодзённая актыўнасць карыстальніка',
  },
  'dashboard.activity.empty': {
    [LanguageCode.en]: 'No activity yet. Solve a few questions first.',
    [LanguageCode.ru]: 'Пока нет активности. Сначала решите несколько вопросов.',
    [LanguageCode.by]: 'Пакуль няма актыўнасці. Спачатку вырашыце некалькі пытанняў.',
  },
  'dashboard.activity.day.no': {
    [LanguageCode.en]: 'No activity on {date}',
    [LanguageCode.ru]: 'Нет активности: {date}',
    [LanguageCode.by]: 'Няма актыўнасці: {date}',
  },
  'dashboard.activity.day.answers.one': {
    [LanguageCode.en]: '{count} answer on {date}',
    [LanguageCode.ru]: '{count} ответ: {date}',
    [LanguageCode.by]: '{count} адказ: {date}',
  },
  'dashboard.activity.day.answers.few': {
    [LanguageCode.en]: '{count} answers on {date}',
    [LanguageCode.ru]: '{count} ответа: {date}',
    [LanguageCode.by]: '{count} адказы: {date}',
  },
  'dashboard.activity.day.answers.many': {
    [LanguageCode.en]: '{count} answers on {date}',
    [LanguageCode.ru]: '{count} ответов: {date}',
    [LanguageCode.by]: '{count} адказаў: {date}',
  },
  'dashboard.activity.day.answers.other': {
    [LanguageCode.en]: '{count} answers on {date}',
    [LanguageCode.ru]: '{count} ответа: {date}',
    [LanguageCode.by]: '{count} адказа: {date}',
  },
  'dashboard.hero.first.label': {
    [LanguageCode.en]: 'Welcome',
    [LanguageCode.ru]: 'Добро пожаловать',
    [LanguageCode.by]: 'Сардэчна запрашаем',
  },
  'dashboard.hero.first.title': {
    [LanguageCode.en]: 'Let’s start your learning journey, {name}',
    [LanguageCode.ru]: 'Давайте начнём ваше обучение, {name}',
    [LanguageCode.by]: 'Пачнём ваш шлях навучання, {name}',
  },
  'dashboard.hero.first.subtitle': {
    [LanguageCode.en]: 'Build your first habit in just a few minutes.',
    [LanguageCode.ru]: 'Сформируйте первую привычку всего за несколько минут.',
    [LanguageCode.by]: 'Сфармуйце першую звычку за некалькі хвілін.',
  },
  'dashboard.hero.first.cta': {
    [LanguageCode.en]: 'Start learning',
    [LanguageCode.ru]: 'Начать обучение',
    [LanguageCode.by]: 'Пачаць навучанне',
  },
  'dashboard.hero.active.label': {
    [LanguageCode.en]: 'You’re on a roll',
    [LanguageCode.ru]: 'Вы в отличном темпе',
    [LanguageCode.by]: 'Вы ў добрым рытме',
  },
  'dashboard.hero.active.title': {
    [LanguageCode.en]: 'Keep the streak alive, {name}',
    [LanguageCode.ru]: 'Поддерживайте серию, {name}',
    [LanguageCode.by]: 'Падтрымлівайце серыю, {name}',
  },
  'dashboard.hero.active.subtitle.zero': {
    [LanguageCode.en]: 'You haven’t answered any questions today. Let’s start!',
    [LanguageCode.ru]: 'Сегодня вы ещё не ответили ни на один вопрос. Давайте начнём!',
    [LanguageCode.by]: 'Сёння вы яшчэ не адказалі ні на адно пытанне. Пачнём!',
  },
  'dashboard.hero.active.subtitle.one': {
    [LanguageCode.en]: 'You’ve answered {count} question today. Keep it going.',
    [LanguageCode.ru]: 'Сегодня вы ответили на {count} вопрос. Продолжайте в том же духе.',
    [LanguageCode.by]: 'Сёння вы адказалі на {count} пытанне. Працягвайце ў тым жа духу.',
  },
  'dashboard.hero.active.subtitle.few': {
    [LanguageCode.en]: 'You’ve answered {count} questions today. Keep it going.',
    [LanguageCode.ru]: 'Сегодня вы ответили на {count} вопроса. Продолжайте в том же духе.',
    [LanguageCode.by]: 'Сёння вы адказалі на {count} пытанні. Працягвайце ў тым жа духу.',
  },
  'dashboard.hero.active.subtitle.many': {
    [LanguageCode.en]: 'You’ve answered {count} questions today. Keep it going.',
    [LanguageCode.ru]: 'Сегодня вы ответили на {count} вопросов. Продолжайте в том же духе.',
    [LanguageCode.by]: 'Сёння вы адказалі на {count} пытанняў. Працягвайце ў тым жа духу.',
  },
  'dashboard.hero.active.subtitle.other': {
    [LanguageCode.en]: 'You’ve answered {count} questions today. Keep it going.',
    [LanguageCode.ru]: 'Сегодня вы ответили на {count} вопроса. Продолжайте в том же духе.',
    [LanguageCode.by]: 'Сёння вы адказалі на {count} пытанні. Працягвайце ў тым жа духу.',
  },
  'dashboard.hero.active.cta': {
    [LanguageCode.en]: 'Resume practice',
    [LanguageCode.ru]: 'Продолжить практику',
    [LanguageCode.by]: 'Працягнуць практыку',
  },
  'dashboard.hero.returning.label': {
    [LanguageCode.en]: 'Your learning space',
    [LanguageCode.ru]: 'Ваше место для обучения',
    [LanguageCode.by]: 'Ваша месца для навучання',
  },
  'dashboard.hero.returning.title': {
    [LanguageCode.en]: 'Ready to continue, {name}?',
    [LanguageCode.ru]: 'Готовы продолжить, {name}?',
    [LanguageCode.by]: 'Гатовы працягнуць, {name}?',
  },
  'dashboard.hero.returning.subtitle': {
    [LanguageCode.en]: 'Pick up where you left off or start something new.',
    [LanguageCode.ru]: 'Продолжите с места, где остановились, или начните что-то новое.',
    [LanguageCode.by]: 'Працягніце з месца, дзе спыніліся, або пачніце нешта новае.',
  },
  'dashboard.hero.returning.cta': {
    [LanguageCode.en]: 'Continue practice',
    [LanguageCode.ru]: 'Продолжить практику',
    [LanguageCode.by]: 'Працягнуць практыку',
  },
  'dashboard.practice.title': {
    [LanguageCode.en]: 'Practice snapshot',
    [LanguageCode.ru]: 'Статистика практики',
    [LanguageCode.by]: 'Статыстыка практыкі',
  },
  'dashboard.practice.correct': {
    [LanguageCode.en]: 'Correct answers',
    [LanguageCode.ru]: 'Правильных ответов',
    [LanguageCode.by]: 'Правільных адказаў',
  },
  'dashboard.practice.accuracy': {
    [LanguageCode.en]: 'Accuracy',
    [LanguageCode.ru]: 'Процент правильных',
    [LanguageCode.by]: 'Працэнт правільных',
  },
  'dashboard.practice.total': {
    [LanguageCode.en]: 'Total answers',
    [LanguageCode.ru]: 'Всего ответов',
    [LanguageCode.by]: 'Усяго адказаў',
  },
  'dashboard.practice.days': {
    [LanguageCode.en]: 'Total days',
    [LanguageCode.ru]: 'Дней практики',
    [LanguageCode.by]: 'Дзён практыкі',
  },
  'dashboard.streak.title.one': {
    [LanguageCode.en]: '{count} day streak',
    [LanguageCode.ru]: '{count} день подряд',
    [LanguageCode.by]: '{count} дзень запар',
  },
  'dashboard.streak.title.few': {
    [LanguageCode.en]: '{count} day streak',
    [LanguageCode.ru]: '{count} дня подряд',
    [LanguageCode.by]: '{count} дні запар',
  },
  'dashboard.streak.title.many': {
    [LanguageCode.en]: '{count} day streak',
    [LanguageCode.ru]: '{count} дней подряд',
    [LanguageCode.by]: '{count} дзён запар',
  },
  'dashboard.streak.title.other': {
    [LanguageCode.en]: '{count} day streak',
    [LanguageCode.ru]: '{count} дня подряд',
    [LanguageCode.by]: '{count} дня запар',
  },
  'dashboard.streak.keep': {
    [LanguageCode.en]: 'Don’t break the chain',
    [LanguageCode.ru]: 'Не останавливайся!',
    [LanguageCode.by]: 'Не спыняйся!',
  },
  'dashboard.streak.best.one': {
    [LanguageCode.en]: 'Personal best: {count} day',
    [LanguageCode.ru]: 'Лучший результат: {count} день',
    [LanguageCode.by]: 'Лепшы вынік: {count} дзень',
  },
  'dashboard.streak.best.few': {
    [LanguageCode.en]: 'Personal best: {count} days',
    [LanguageCode.ru]: 'Лучший результат: {count} дня',
    [LanguageCode.by]: 'Лепшы вынік: {count} дні',
  },
  'dashboard.streak.best.many': {
    [LanguageCode.en]: 'Personal best: {count} days',
    [LanguageCode.ru]: 'Лучший результат: {count} дней',
    [LanguageCode.by]: 'Лепшы вынік: {count} дзён',
  },
  'dashboard.streak.best.other': {
    [LanguageCode.en]: 'Personal best: {count} days',
    [LanguageCode.ru]: 'Лучший результат: {count} дня',
    [LanguageCode.by]: 'Лепшы вынік: {count} дня',
  },
  'dashboard.recent.title': {
    [LanguageCode.en]: 'Recent topics',
    [LanguageCode.ru]: 'Прохожу сейчас',
    [LanguageCode.by]: 'Праходжу зараз',
  },
  'dashboard.tip.jsfact.title': {
    [LanguageCode.en]: 'JavaScript fact',
    [LanguageCode.ru]: 'Факт о JavaScript',
    [LanguageCode.by]: 'Факт пра JavaScript',
  },
  'dashboard.tip.jsfact.null': {
    [LanguageCode.en]: '`typeof null` returns "object" — this is a historical bug in JavaScript.',
    [LanguageCode.ru]: '`typeof null` возвращает "object" — историческая ошибка JS.',
    [LanguageCode.by]: '`typeof null` вяртае "object" — гістарычная памылка JS.',
  },
  'dashboard.tip.jsfact.nan': {
    [LanguageCode.en]: '`NaN === NaN` is false. Use Number.isNaN() to check it.',
    [LanguageCode.ru]: '`NaN === NaN` возвращает false. Используйте Number.isNaN().',
    [LanguageCode.by]: '`NaN === NaN` вяртае false. Выкарыстоўвайце Number.isNaN().',
  },
  'dashboard.tip.jsfact.array_plus_array': {
    [LanguageCode.en]: '`[] + []` results in an empty string "" because of type coercion.',
    [LanguageCode.ru]: '`[] + []` даёт пустую строку "" из-за приведения типов.',
    [LanguageCode.by]: '`[] + []` дае пусты радок "" праз прывядзенне тыпаў.',
  },

  /// results
  'results.perfect.title': {
    [LanguageCode.en]: 'Perfect Score!',
    [LanguageCode.ru]: 'Идеальный результат!',
    [LanguageCode.by]: 'Ідэальны вынік!',
  },
  'results.perfect.description': {
    [LanguageCode.en]: 'Outstanding work. You got everything right!',
    [LanguageCode.ru]: 'Отличная работа. Все ответы верны!',
    [LanguageCode.by]: 'Выдатная праца. Усё правільна!',
  },

  'results.great.title': {
    [LanguageCode.en]: 'Great job!',
    [LanguageCode.ru]: 'Отличная работа!',
    [LanguageCode.by]: 'Выдатна!',
  },
  'results.great.description': {
    [LanguageCode.en]: 'You did really well. Keep it up!',
    [LanguageCode.ru]: 'Вы справились очень хорошо. Продолжайте в том же духе!',
    [LanguageCode.by]: 'Вы справіліся вельмі добра. Працягвайце!',
  },

  'results.good.title': {
    [LanguageCode.en]: 'Good effort!',
    [LanguageCode.ru]: 'Хорошая попытка!',
    [LanguageCode.by]: 'Добрая спроба!',
  },
  'results.good.description': {
    [LanguageCode.en]: 'Nice progress. A bit more practice and you will master it.',
    [LanguageCode.ru]: 'Хороший прогресс. Немного практики — и вы освоите это.',
    [LanguageCode.by]: 'Добры прагрэс. Яшчэ крыху практыкі — і ўсё атрымаецца.',
  },

  'results.keepGoing.title': {
    [LanguageCode.en]: 'Keep going!',
    [LanguageCode.ru]: 'Продолжайте!',
    [LanguageCode.by]: 'Працягвайце!',
  },
  'results.keepGoing.description': {
    [LanguageCode.en]: 'Not bad. Try again and you will improve.',
    [LanguageCode.ru]: 'Неплохо. Попробуйте снова — станет лучше.',
    [LanguageCode.by]: 'Нядрэнна. Паспрабуйце яшчэ раз — будзе лепш.',
  },

  'results.retry.title': {
    [LanguageCode.en]: 'Give it another try',
    [LanguageCode.ru]: 'Попробуйте ещё раз',
    [LanguageCode.by]: 'Паспрабуйце яшчэ раз',
  },
  'results.retry.description': {
    [LanguageCode.en]: 'No correct answers yet, but that is how learning starts.',
    [LanguageCode.ru]: 'Пока нет правильных ответов, но с этого начинается обучение.',
    [LanguageCode.by]: 'Пакуль няма правільных адказаў, але так пачынаецца навучанне.',
  },
  'results.correctAnswers': {
    [LanguageCode.en]: 'Correct Answers',
    [LanguageCode.ru]: 'Правильные ответы',
    [LanguageCode.by]: 'Правільныя адказы',
  },
  'results.percentage': {
    [LanguageCode.en]: 'correct',
    [LanguageCode.ru]: 'правильно',
    [LanguageCode.by]: 'правільна',
  },
  'results.backToLibrary': {
    [LanguageCode.en]: 'Back to Library',
    [LanguageCode.ru]: 'Назад в библиотеку',
    [LanguageCode.by]: 'Назад у бібліятэку',
  },
  'results.startOver': {
    [LanguageCode.en]: 'Start Over',
    [LanguageCode.ru]: 'Начать заново',
    [LanguageCode.by]: 'Пачаць зноў',
  },
  /// widget
  'widget.button.checkAnswer': {
    [LanguageCode.en]: 'Check Answer',
    [LanguageCode.ru]: 'Проверить ответ',
    [LanguageCode.by]: 'Праверыць адказ',
  },
  'widget.button.nextQuestion': {
    [LanguageCode.en]: 'Next Question',
    [LanguageCode.ru]: 'Следующий вопрос',
    [LanguageCode.by]: 'Наступнае пытанне',
  },
  'widget.codeCompletion.description': {
    [LanguageCode.en]: 'Fill in the missing code',
    [LanguageCode.ru]: 'Заполните пропущенный код',
    [LanguageCode.by]: 'Запоўніце прапушчаны код',
  },
  /// runner
  'runner.progress.question': {
    [LanguageCode.en]: 'Question',
    [LanguageCode.ru]: 'Вопрос',
    [LanguageCode.by]: 'Пытанне',
  },
  'runner.progress.of': {
    [LanguageCode.en]: 'of',
    [LanguageCode.ru]: 'из',
    [LanguageCode.by]: 'з',
  },
  'runner.progress.accuracy': {
    [LanguageCode.en]: 'Accuracy',
    [LanguageCode.ru]: 'Точность',
    [LanguageCode.by]: 'Дакладнасць',
  },

  /// Widgets
  'widget.question.check': {
    [LanguageCode.en]: 'Check Answer',
    [LanguageCode.ru]: 'Проверить ответ',
    [LanguageCode.by]: 'Праверыць адказ',
  },
  'widget.question.next': {
    [LanguageCode.en]: 'Next Question',
    [LanguageCode.ru]: 'Следующий вопрос',
    [LanguageCode.by]: 'Наступнае пытанне',
  },
  /// FlipCard Widget
  'widget.flip-card.tooltip_hint': {
    [LanguageCode.en]:
      'Decide whether you know the answer to reveal it. You can change your resolution after card reveal.',
    [LanguageCode.ru]:
      'Решите, знаете ли вы ответ, чтобы открыть его. Вы сможете изменить решение после открытия карточки.',
    [LanguageCode.by]:
      'Вырашыце, ці ведаеце вы адказ, каб адкрыць яго. Вы зможаце змяніць рашэнне пасля адкрыцця карткі.',
  },
  'widget.flip-card.know': {
    [LanguageCode.en]: 'I know this',
    [LanguageCode.ru]: 'Я это знаю',
    [LanguageCode.by]: 'Я гэта ведаю',
  },
  'widget.flip-card.not-know': {
    [LanguageCode.en]: "I don't know this",
    [LanguageCode.ru]: 'Я этого не знаю',
    [LanguageCode.by]: 'Я гэтага не ведаю',
  },
  /// BigO Widget
  'widget.big-o.selected': {
    en: 'Selected',
    ru: 'Выбрано',
    by: 'Выбрана',
  },
  'widget.big-o.tooltip_hint': {
    en: 'Click on a curve to select complexity of the algorithm',
    ru: 'Нажмите на кривую, чтобы выбрать сложность алгоритма',
    by: 'Націсніце на крывую, каб выбраць складанасць алгарытму',
  },

  /// Buttons
  'button.hint': {
    [LanguageCode.en]: 'Hint',
    [LanguageCode.ru]: 'Подсказка',
    [LanguageCode.by]: 'Падказка',
  },
  'button.next': {
    [LanguageCode.en]: 'Next',
    [LanguageCode.ru]: 'Далее',
    [LanguageCode.by]: 'Далей',
  },
  'button.check-answer': {
    [LanguageCode.en]: 'Check Answer',
    [LanguageCode.ru]: 'Проверить ответ',
    [LanguageCode.by]: 'Праверыць адказ',
  },
  'button.sign-in': {
    [LanguageCode.en]: 'Sign In',
    [LanguageCode.ru]: 'Войти',
    [LanguageCode.by]: 'Увайсці',
  },
  'button.sign-up': {
    [LanguageCode.en]: 'Sign Up',
    [LanguageCode.ru]: 'Регистрация',
    [LanguageCode.by]: 'Рэгістрацыя',
  },
  'button.sign-out': {
    [LanguageCode.en]: 'Sign Out',
    [LanguageCode.ru]: 'Выйти',
    [LanguageCode.by]: 'Выйсці',
  },

  /// Authentication & Session Errors
  'error.auth.signin.invalid': {
    [LanguageCode.en]: 'Invalid email or password.',
    [LanguageCode.ru]: 'Неверный адрес почты или пароль.',
    [LanguageCode.by]: 'Несапраўдны адрас пошты ці пароль.',
  },
  'error.auth.signup.invalid': {
    [LanguageCode.en]: 'Invalid credentials passed.',
    [LanguageCode.ru]: 'Предоставлены неверные учетные данные.',
    [LanguageCode.by]: 'Прадастаўлены несапраўдныя ўліковыя даныя.',
  },
  'error.auth.expired': {
    [LanguageCode.en]: 'Your session has expired. Please sign in again.',
    [LanguageCode.ru]: 'Сессия истекла. Пожалуйста, войдите снова.',
    [LanguageCode.by]: 'Сесія скончылася. Калі ласка, увайдзіце зноў.',
  },
  'error.auth.conflict': {
    [LanguageCode.en]: 'This account or username already exists.',
    [LanguageCode.ru]: 'Этот аккаунт или имя пользователя уже существует.',
    [LanguageCode.by]: 'Гэты рахунак ці імя карыстальніка ўжо існуе.',
  },
  'error.auth.rate_limit': {
    [LanguageCode.en]: 'Too many attempts. Please try again later.',
    [LanguageCode.ru]: 'Слишком много попыток. Пожалуйста, попробуйте позже.',
    [LanguageCode.by]: 'Занадта шмат спроб. Калі ласка, паспрабуйце пазней.',
  },
  'error.auth.required': {
    [LanguageCode.en]: 'Please fill in all required fields.',
    [LanguageCode.ru]: 'Пожалуйста, заполните все обязательные поля.',
    [LanguageCode.by]: 'Калі ласка, запоўніце ўсе абавязковыя палі.',
  },
  'error.auth.not-found': {
    [LanguageCode.en]: 'No account found with these credentials.',
    [LanguageCode.ru]: 'Аккаунт с такими данными не найден.',
    [LanguageCode.by]: 'Акаўнт з такімі данымі не знойдзены.',
  },
  'error.auth.invalid-account-data': {
    [LanguageCode.en]: 'Invalid account data received.',
    [LanguageCode.ru]: 'Получены некорректные данные аккаунта.',
    [LanguageCode.by]: 'Атрыманы некарэктныя даныя акаўнта.',
  },

  /// Server & Network Errors
  'error.server.maintenance': {
    [LanguageCode.en]: 'Server is under maintenance. Please try again shortly.',
    [LanguageCode.ru]: 'Сервер на техническом обслуживании. Попробуйте позже.',
    [LanguageCode.by]: 'Сервер на тэхнічным абслугоўванні. Паспрабуйце пазней.',
  },
  'error.server.timeout': {
    [LanguageCode.en]: 'The request timed out. Please check your connection.',
    [LanguageCode.ru]: 'Время ожидания истекло. Проверьте соединение.',
    [LanguageCode.by]: 'Час чакання скончыўся. Праверце злучэнне.',
  },

  /// Global Fallback
  'error.global.unknown': {
    [LanguageCode.en]: 'An unexpected error occurred.',
    [LanguageCode.ru]: 'Произошла непредвиденная ошибка.',
    [LanguageCode.by]: 'Адбылася неспадзяваная памылка.',
  },

  /// Zod Schema Messages
  'validation.email_invalid': {
    [LanguageCode.en]: 'Please enter a valid email address.',
    [LanguageCode.ru]: 'Введите корректный адрес почты.',
    [LanguageCode.by]: 'Увядзіце карэктны адрас пошты.',
  },
  'validation.password_too_short': {
    [LanguageCode.en]: 'Password is too short.',
    [LanguageCode.ru]: 'Пароль слишком короткий.',
    [LanguageCode.by]: 'Пароль занадта кароткі.',
  },
  'validation.username_too_short': {
    [LanguageCode.en]: 'Username must be at least 3 characters.',
    [LanguageCode.ru]: 'Имя пользователя должно быть не менее 3 символов.',
    [LanguageCode.by]: 'Імя карыстальніка павінна быць не менш за 3 сімвалы.',
  },
  'validation.username_too_long': {
    [LanguageCode.en]: 'Username must be at most 12 characters.',
    [LanguageCode.ru]: 'Имя пользователя должно быть не более 12 символов.',
    [LanguageCode.by]: 'Імя карыстальніка павінна быць не больш за 12 сімвалаў.',
  },
  'validation.username_invalid': {
    [LanguageCode.en]: 'Username contains invalid characters.',
    [LanguageCode.ru]: 'Имя пользователя содержит недопустимые символы.',
    [LanguageCode.by]: 'Імя карыстальніка ўтрымлівае недапушчальныя сімвалы.',
  },
  'validation.password_mismatch': {
    [LanguageCode.en]: 'Passwords do not match.',
    [LanguageCode.ru]: 'Пароли не совпадают.',
    [LanguageCode.by]: 'Паролі не супадаюць.',
  },
  'validation.required': {
    [LanguageCode.en]: 'This field is required.',
    [LanguageCode.ru]: 'Это поле обязательно для заполнения.',
    [LanguageCode.by]: 'Гэта поле абавязкова для запаўнення.',
  },
  'validation.selection_required': {
    [LanguageCode.en]: 'Please select an option.',
    [LanguageCode.ru]: 'Пожалуйста, выберите вариант.',
    [LanguageCode.by]: 'Калі ласка, абярыце варыянт.',
  },
  'validation.uppercase': {
    [LanguageCode.en]: 'Must contain at least one uppercase letter.',
    [LanguageCode.ru]: 'Должен содержать хотя бы одну заглавную букву.',
    [LanguageCode.by]: 'Павінен утрымліваць хаця б адну вялікую літару.',
  },

  'widget.codeOrdering.description': {
    [LanguageCode.en]: 'Arrange the code lines in the correct order',
    [LanguageCode.ru]: 'Расставь строки кода в правильном порядке',
    [LanguageCode.by]: 'Размясці радкі кода ў правільным парадку',
  },
  'widget.codeOrdering.keyboardHint': {
    [LanguageCode.en]: 'Arrows — move • Enter — pick/place • Esc — cancel',
    [LanguageCode.ru]: 'Стрелки — перемещение • Enter — взять/вставить • Esc — отменить',
    [LanguageCode.by]: 'Стрэлкі — перамяшчэнне • Enter — узяць/уставіць • Esc — адмяніць',
  },

  'widget.questionCard.keyboardHint': {
    [LanguageCode.en]: 'Numbers 1–{count} — select option • Enter — check/next question',
    [LanguageCode.ru]: 'Цифры 1–{count} — выбрать вариант • Enter — проверить/следующий вопрос',
    [LanguageCode.by]: 'Лічбы 1–{count} — выбраць варыянт • Enter — праверыць/наступнае пытанне',
  },

  'widget.keyboardHint.title': {
    [LanguageCode.en]: 'Keyboard controls',
    [LanguageCode.ru]: 'Управление с клавиатуры',
    [LanguageCode.by]: 'Кіраванне з клавіятуры',
  },
} satisfies Record<string, LocaleString>;

export type MessageKey = keyof typeof AppMessages;
