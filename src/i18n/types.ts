export type AppLocale = 'en' | 'ru' | 'es' | 'pt-BR' | 'id';

export interface WelcomeStory {
  title: string;
  text: string;
  link?: { text: string; url: string };
}

export interface Translations {
  dir: 'ltr' | 'rtl';
  welcomeStories: WelcomeStory[];
  ui: {
    start: string;
    swipeHint: string;
    eyeContactTitle: string;
    finalEyeContactTitle: string;
    eyeContactText: string;
    finalEyeContactText: string;
    startOver: string;
    nextBlock: string;
    feedback: string;
    learnMore: string;
    block: string;
    next: string;
    finish: string;
    language: string;
    chooseLanguage: string;
    automaticLanguage: string;
  };
  questions: string[];
}
