import { WidgetOverview } from '@/types/schemas/widget-schema';
import { WidgetType } from '@/types/widget';

export const mockWidgets: WidgetOverview[] = [
  {
    type: WidgetType.CodeOrdering,
    name: {
      en: 'Code Ordering',
      ru: 'Порядок кода',
      by: 'Парадак кода',
    },
    description: {
      en: 'Arrange the code lines in the correct execution order.',
      ru: 'Расположите строки кода в правильном порядке выполнения.',
      by: 'Размясціце радкі кода ў правільным парадку выканання.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.AsyncSorter,
    name: {
      en: 'Async Code Sorter',
      ru: 'Сортировщик асинхронного кода',
      by: 'Сартыроўшчык асінхроннага кода',
    },
    description: {
      en: 'Arrange the code blocks in the order they will execute.',
      ru: 'Расставьте блоки кода в порядке их выполнения.',
      by: 'Расстаўце блокі кода ў парадку іх выканання.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.Quiz,
    name: {
      en: 'Single Choice Quiz',
      ru: 'Квиз с одним ответом',
      by: 'Квіз з адным адказам',
    },
    description: {
      en: 'Select the correct answer from the given options.',
      ru: 'Выберите правильный ответ из предложенных вариантов.',
      by: 'Выберыце правільны адказ з прапанаваных варыянтаў.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.TrueFalse,
    name: {
      en: 'True or False',
      ru: 'Правда или Ложь',
      by: 'Праўда ці Хлусня',
    },
    description: {
      en: 'Decide whether the given statement is true or false.',
      ru: 'Определите, является ли данное утверждение истинным или ложным.',
      by: 'Вызначце, ці з’яўляецца дадзенае сцвярджэнне праўдзівым ці ілжывым.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.CodeCompletion,
    name: {
      en: 'Code Completion',
      ru: 'Дополнение кода',
      by: 'Дапаўненне кода',
    },
    description: {
      en: 'Fill in the missing parts of the code.',
      ru: 'Заполните пропущенные части кода.',
      by: 'Запоўніце прапушчаныя часткі кода.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.FlipCard,
    name: {
      en: 'Flip Card',
      ru: 'Флеш-карточки',
      by: 'Флэш-карткі',
    },
    description: {
      en: 'Flip the card to reveal the explanation.',
      ru: 'Переверните карточку, чтобы увидеть объяснение.',
      by: 'Перавярніце картку, каб убачыць тлумачэнне.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
  {
    type: WidgetType.BigONotation,
    name: {
      en: 'Big O Notation',
      ru: 'Big O Нотация',
      by: 'Big O Натацыя',
    },
    description: {
      en: 'Hover lines to see values and select the correct complexity.',
      ru: 'Наведите на линии, чтобы увидеть значения, и выберите правильную сложность.',
      by: 'Навядзіце на лініі, каб убачыць значэнні, і выберыце правільную складанасць.',
    },
    createdAt: new Date(),
    totalQuestions: 0,
    correctAnswers: 0,
  },
];
