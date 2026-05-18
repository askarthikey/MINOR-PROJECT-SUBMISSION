import { QuestionInfo } from '@/types/schemas/question-schemas';
import { WidgetType } from '@/types/widget';

export const mockQuestions: QuestionInfo[] = [
  {
    id: 1,
    topicId: 1,
    type: WidgetType.CodeOrdering,
    payload: {
      description: {
        en: 'Implement a debounce function',
        ru: 'Реализуй функцию debounce',
        by: 'Рэалізуй функцыю debounce',
      },
      lines: [
        'return function(...args) {',
        'let timeout;',
        'clearTimeout(timeout);',
        'timeout = setTimeout(() => fn(...args), delay);',
        '};',
      ],
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 2,
    topicId: 1,
    type: WidgetType.Quiz,
    payload: {
      question: {
        en: 'What does <i>typeof null</i> return?',
        ru: 'Что возвращает <i>typeof null</i>?',
        by: 'Што вяртае <i>typeof null</i>?',
      },
      options: [
        { en: 'null', ru: 'null', by: 'null' },
        { en: 'undefined', ru: 'undefined', by: 'undefined' },
        { en: 'object', ru: 'объект', by: 'аб’ект' },
        { en: 'NaN', ru: 'NaN', by: 'NaN' },
      ],
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 3,
    topicId: 1,
    type: WidgetType.TrueFalse,
    payload: {
      statement: {
        en: '<i>Promise.all()</i> returns results in order of completion',
        ru: '<i>Promise.all()</i> возвращает результаты в порядке завершения',
        by: '<i>Promise.all()</i> вяртае вынікі ў парадку завяршэння',
      },
      explanation: {
        en: '<i>Promise.all()</i> preserves input array order, regardless of completion time',
        ru: '<i>Promise.all()</i> сохраняет порядок входного массива, независимо от времени завершения',
        by: '<i>Promise.all()</i> захоўвае парадак уваходнага масіва, незалежна ад часу завяршэння',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 4,
    topicId: 1,
    type: WidgetType.CodeCompletion,
    payload: {
      code: 'const result = arr.___(x => x > 0).___(x => x * 2);',
      blanks: ['___', '___'],
      hints: [
        {
          en: 'This method filters elements based on a condition',
          ru: 'Этот метод фильтрует элементы на основе условия',
          by: 'Гэты метад фільтруе элементы на аснове ўмовы',
        },
        {
          en: 'This method transforms each element of the array',
          ru: 'Этот метод преобразует каждый элемент массива',
          by: 'Гэты метад пераўтварае кожны элемент масіва',
        },
      ],
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 5,
    topicId: 1,
    type: WidgetType.CodeCompletion,
    payload: {
      code: 'const result = arr.___(x => x > 0);',
      blanks: ['filter'],
      hints: [
        {
          en: 'This method returns a new array with elements that pass the test',
          ru: 'Этот метод возвращает новый массив с элементами, прошедшими проверку',
          by: 'Гэты метад вяртае новы масіў з элементамі, якія прайшлі праверку',
        },
      ],
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 6,
    topicId: 1,
    type: WidgetType.BigONotation,
    payload: {
      question: {
        en: 'What is the time complexity of this algorithm?',
        ru: 'Какова временная сложность этого алгоритма?',
        by: 'Якая часавая складанасць гэтага алгарытму?',
      },
      codeExample: '<code>for (let i = 0; i < n; i++) { \n  console.log(i); \n}</code>',
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 7,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Closure', ru: 'Замыкание', by: 'Замыканне' },
      definition: {
        en: 'A function that remembers variables from its lexical scope.',
        ru: 'Функция, которая запоминает переменные из своей области видимости.',
        by: 'Функцыя, якая запамінае зменныя са сваёй вобласці бачнасці.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 8,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Hoisting', ru: 'Поднятие (Hoisting)', by: 'Узняцце (Hoisting)' },
      definition: {
        en: 'Declarations are moved to the top of their scope during compilation.',
        ru: 'Объявления перемещаются в начало области видимости при компиляции.',
        by: 'Аб’явы перамяшчаюцца ў пачатак вобласці бачнасці пры кампіляцыі.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 9,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Event Loop', ru: 'Цикл событий', by: 'Цыкл падзей' },
      definition: {
        en: 'Mechanism that handles asynchronous callbacks.',
        ru: 'Механизм, обрабатывающий асинхронные вызовы.',
        by: 'Механізм, які апрацоўвае асінхронныя выклікі.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 10,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Promise', ru: 'Промис', by: 'Проміс' },
      definition: {
        en: 'Object representing eventual completion of an async operation.',
        ru: 'Объект, представляющий результат асинхронной операции.',
        by: 'Аб’ект, які прадстаўляе вынік асінхроннай аперацыі.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 11,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Callback', ru: 'Колбэк', by: 'Колбэк' },
      definition: {
        en: 'Function passed as an argument to be executed later.',
        ru: 'Функция, переданная как аргумент для вызова позже.',
        by: 'Функцыя, перададзеная як аргумент для выкліку пазней.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 12,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Arrow Function', ru: 'Стрелочная функция', by: 'Стрэлачная функцыя' },
      definition: {
        en: 'Shorter syntax that does not have its own "this".',
        ru: 'Краткий синтаксис, не имеющий собственного "this".',
        by: 'Краткі сінтаксіс, які не мае ўласнага "this".',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 13,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Prototype', ru: 'Прототип', by: 'Прататып' },
      definition: {
        en: 'Object from which other objects inherit properties.',
        ru: 'Объект, от которого наследуются свойства.',
        by: 'Аб’ект, ад якога ўспадкоўваюцца ўласцівасці.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 14,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Destructuring', ru: 'Деструктуризация', by: 'Дэструктурызацыя' },
      definition: {
        en: 'Extracting values from arrays/objects into variables.',
        ru: 'Извлечение значений в отдельные переменные.',
        by: 'Здабыванне значэнняў у асобныя зменныя.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 15,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Strict Mode', ru: 'Строгий режим', by: 'Строгі рэжым' },
      definition: {
        en: 'Restricted variant of JS that prevents unsafe actions.',
        ru: 'Вариант JS, предотвращающий небезопасные действия.',
        by: 'Варыянт JS, які прадухіляе небяспечныя дзеянні.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 16,
    topicId: 1,
    type: WidgetType.FlipCard,
    payload: {
      term: { en: 'Debouncing', ru: 'Debouncing', by: 'Debouncing' },
      definition: {
        en: 'Limiting frequency of function execution.',
        ru: 'Ограничение частоты выполнения функции.',
        by: 'Абмежаванне частаты выканання функцыі.',
      },
    },
    isSuccess: false,
    updatedAt: undefined,
  },
  {
    id: 17,
    topicId: 1,
    type: WidgetType.AsyncSorter,
    payload: {
      codeSnippet:
        "<code>console.log('Start');\n\nsetTimeout(() => {\n  console.log('Timeout');\n}, 0);\n\nPromise.resolve().then(() => {\n  console.log('Promise');\n});\n\nconsole.log('End');</code>",
      blocks: [
        { id: 'b1', code: 'Start', label: '1' },
        { id: 'b2', code: 'Timeout', label: '2' },
        { id: 'b3', code: 'Promise', label: '3' },
        { id: 'b4', code: 'End', label: '4' },
      ],
    },
    isSuccess: false,
    updatedAt: undefined,
  },
];
