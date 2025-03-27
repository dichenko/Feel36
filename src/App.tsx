import React, { useState, useEffect } from 'react';
import { Heart, Eye, ChevronRight, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { questions } from './questions';

// Определяем тип для Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: string;
          hash?: string;
          start_param?: string;
        };
        startParams?: string;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          isVisible: boolean;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
      };
    };
  }
}

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showEyeContact, setShowEyeContact] = useState(false);
  const [showFinalEyeContact, setShowFinalEyeContact] = useState(false);
  const [currentStory, setCurrentStory] = useState(0);

  // Инициализация Telegram Mini App
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // Проверяем поддержку BackButton
    if (!tg.BackButton) {
      return;
    }

    if (isStarted && !showEyeContact && !showFinalEyeContact) {
      try {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
          } else if (currentSet > 0) {
            setCurrentSet(currentSet - 1);
            setCurrentQuestion(questions.length / 3 - 1);
          } else {
            setIsStarted(false);
          }
        });
      } catch (error) {
        // Игнорируем ошибки с BackButton
      }
    } else {
      try {
        tg.BackButton.hide();
      } catch (error) {
        // Игнорируем ошибки с BackButton
      }
    }

    // Очистка обработчика событий кнопки "Назад"
    return () => {
      try {
        tg.BackButton.onClick(() => {});
      } catch (error) {
        // Игнорируем ошибки с BackButton
      }
    };
  }, [isStarted, currentSet, currentQuestion, showEyeContact, showFinalEyeContact]);

  const welcomeStories = [
    {
      title: "Добро пожаловать в FeelMe36",
      text: "Перед вами набор из 36 вопросов, призванных сблизить вас и вашего партнера. Вопросы разбиты на три блока, с каждым блоком вопросы все более глубокие и откровенные."
    },
    {
      title: "Выделите время",
      text: "Выделите время, когда вас двоих никто не будет отвлекать. Отвечайте по очереди на каждый вопрос. "
    },
    {
      title: "Зрительный контакт",
      text: "Когда заканчивается блок вопросов, оставайтесь в тишине, и просто смотрите друг другу в глаза от 1 до 4 минут. Это усилит ощущение вашей близости."
    }
  ];

  const totalSets = 3;
  const questionsPerSet =  12;
  const currentSetQuestions = questions.slice(
    currentSet * questionsPerSet,
    (currentSet + 1) * questionsPerSet
  );

  const handleNext = () => {
    if (currentQuestion < questionsPerSet - 1) {
      setCurrentQuestion(currentQuestion +  1);
    } else if (currentSet < totalSets - 1) {
      setShowEyeContact(true);
    } else {
      setShowFinalEyeContact(true);
    }
  };

  const handleNextSet = () => {
    setCurrentSet(currentSet + 1);
    setCurrentQuestion(0);
    setShowEyeContact(false);
  };

  const restart = () => {
    setIsStarted(false);
    setCurrentSet(0);
    setCurrentQuestion(0);
    setShowEyeContact(false);
    setShowFinalEyeContact(false);
    setCurrentStory(0);
  };

  const nextStory = () => {
    if (currentStory < welcomeStories.length - 1) {
      setCurrentStory(currentStory + 1);
    }
  };

  const prevStory = () => {
    if (currentStory > 0) {
      setCurrentStory(currentStory - 1);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[430px] relative">
          {/* Story card */}
          <div className="story-card backdrop-blur-sm rounded-3xl card-shadow overflow-hidden aspect-[9/16] relative">
            {/* Navigation buttons */}
            <button
              onClick={prevStory}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 backdrop-blur-sm text-rose-500 shadow-lg transition-all hover:scale-105 active:scale-95 z-10 ${
                currentStory === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-rose-50'
              }`}
              disabled={currentStory === 0}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextStory}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 backdrop-blur-sm text-rose-500 shadow-lg transition-all hover:scale-105 active:scale-95 z-10 ${
                currentStory === welcomeStories.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-rose-50'
              }`}
              disabled={currentStory === welcomeStories.length - 1}
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="h-full flex flex-col justify-between p-8 relative">
              {/* Декоративные элементы */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-200/40 to-transparent rounded-bl-full -z-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-rose-200/40 to-transparent rounded-tr-full -z-10"></div>
              
              <TransitionGroup>
                <CSSTransition
                  key={currentStory}
                  timeout={400}
                  classNames="story-transition"
                >
                  <div className="flex flex-col items-center text-center mt-8">
                    <div className="w-16 h-16 mb-6 rounded-full bg-rose-100/80 flex items-center justify-center">
                      {currentStory === 0 && <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />}
                      {currentStory === 1 && <Eye className="w-8 h-8 text-rose-500" />}
                      {currentStory === 2 && <ChevronRight className="w-8 h-8 text-rose-500" />}
                    </div>
                    <h2 className="text-2xl font-semibold text-rose-900 mb-6">
                      {welcomeStories[currentStory].title}
                    </h2>
                    <p className="text-lg text-rose-800/90 mb-8 leading-relaxed">
                      {welcomeStories[currentStory].text}
                    </p>

                    {currentStory === welcomeStories.length - 1 && (
                      <button
                        onClick={() => setIsStarted(true)}
                        className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Готовы начать
                      </button>
                    )}
                  </div>
                </CSSTransition>
              </TransitionGroup>
              
              <div className="w-full flex flex-col items-center">
                {/* Heart icon with text */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">FeelMe36</h1>
                </div>
                <p className="text-sm text-rose-600/80 mb-5">36 вопросов, чтобы влюбить кого угодно</p>
                
                {/* Progress indicators moved to bottom */}
                <div className="flex justify-center gap-2">
                  {welcomeStories.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full progress-indicator ${
                        index === currentStory ? "active w-14" : 
                        index < currentStory ? "w-14 bg-rose-300" : 
                        "w-10 bg-rose-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showEyeContact || showFinalEyeContact) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[430px] story-card backdrop-blur-sm p-8 rounded-3xl card-shadow text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-100/80 flex items-center justify-center">
            <Eye className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
            {showFinalEyeContact ? "Финальный зрительный контакт" : "Время для зрительного контакта"}
          </h2>
          <p className="text-lg text-rose-800/90 mb-8 leading-relaxed">
            {showFinalEyeContact 
              ? "Поздравляем! Вы прошли все 36 вопросов. Теперь посмотрите друг другу в глаза в течение 4 минут, чтобы закрепить вашу связь."
              : "Посмотрите друг другу в глаза в течение 4 минут. Это поможет установить более глубокую связь."}
          </p>
          <button
            onClick={showFinalEyeContact ? restart : handleNextSet}
            className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {showFinalEyeContact ? "Начать сначала" : "Перейти к следующему блоку"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[430px] story-card backdrop-blur-sm p-6 sm:p-8 rounded-3xl card-shadow relative">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-200/40 to-transparent rounded-bl-full z-0"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-200/40 to-transparent rounded-tr-full z-0"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">FeelMe36</h1>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-rose-50 text-sm font-medium text-rose-600/80">
            Блок {currentSet + 1} из {totalSets}
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 flex-1 rounded-full bg-rose-100">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 shadow-sm"
                style={{ width: `${((currentQuestion + 1) / questionsPerSet) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-rose-600/80 bg-rose-50 px-2 py-0.5 rounded-full">
              {currentQuestion + 1}/{questionsPerSet}
            </span>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-5 rounded-xl shadow-sm">
            <p className="text-xl text-rose-900 leading-relaxed">
              {currentSetQuestions[currentQuestion]}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <button
            onClick={restart}
            className="text-rose-600 hover:text-rose-700 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Начать сначала
          </button>
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {currentQuestion < questionsPerSet - 1 ? (
              <>
                Следующий вопрос
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              'Завершить блок'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;