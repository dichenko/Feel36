import React, { useState, useEffect, TouchEvent } from 'react';
import { Heart, Eye, ChevronRight, RotateCcw } from 'lucide-react';
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
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Загрузка сохраненного прогресса при первом рендере
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('feelme36_progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setIsStarted(progress.isStarted);
        setCurrentSet(progress.currentSet);
        setCurrentQuestion(progress.currentQuestion);
        setShowEyeContact(progress.showEyeContact);
        setShowFinalEyeContact(progress.showFinalEyeContact);
      }
    } catch (error) {
      console.error('Ошибка при загрузке прогресса:', error);
    }
  }, []);

  // Проверка наличия сохраненного прогресса
  const hasProgress = () => {
    try {
      return !!localStorage.getItem('feelme36_progress');
    } catch {
      return false;
    }
  };

  // Пропуск stories при наличии прогресса
  useEffect(() => {
    if (hasProgress() && !isStarted) {
      setIsStarted(true);
    }
  }, [isStarted]);

  // Сохранение прогресса при изменении состояния
  useEffect(() => {
    try {
      const progress = {
        isStarted,
        currentSet,
        currentQuestion,
        showEyeContact,
        showFinalEyeContact
      };
      localStorage.setItem('feelme36_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error);
    }
  }, [isStarted, currentSet, currentQuestion, showEyeContact, showFinalEyeContact]);

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

    try {
      // Показываем кнопку назад на всех экранах
      tg.BackButton.show();
      // Закрываем приложение при нажатии на BackButton
      tg.BackButton.onClick(() => {
        tg.close();
      });
    } catch (error) {
      // Игнорируем ошибки с BackButton
    }

    // Очистка обработчика событий кнопки "Назад"
    return () => {
      try {
        tg.BackButton.onClick(() => {});
      } catch (error) {
        // Игнорируем ошибки с BackButton
      }
    };
  }, []);

  const welcomeStories = [
    {
      title: "Как влюбиться за 45 минут",
      text: "Перед вами набор из 36 вопросов, призванных сблизить вас и вашего партнера. Вопросы разбиты на три блока, с каждым блоком вопросы все более глубокие и откровенные.",
      link: {
        text: "Всё по науке!",
        url: "https://telegra.ph/36-voprosov-chtoby-vlyubitsya-03-27"
      }
    },
    {
      title: "Безопасная атмосфера",
      text: "Организуйте время и место,где вас двоих никто не будет отвлекать. Отвечайте по очереди на каждый вопрос. "
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
    // Удаляем сохраненный прогресс при перезапуске
    try {
      localStorage.removeItem('feelme36_progress');
    } catch (error) {
      console.error('Ошибка при удалении прогресса:', error);
    }
    
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

  // Обработчики свайпов для stories
  const handleStoryTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleStoryTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleStoryTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      // Свайп влево - следующая история
      nextStory();
    } else if (distance < -minSwipeDistance) {
      // Свайп вправо - предыдущая история
      prevStory();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Обработчики свайпов для вопросов
  const handleQuestionTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleQuestionTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleQuestionTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      // Свайп влево - следующий вопрос
      handleNext();
    } else if (distance < -minSwipeDistance && currentQuestion > 0) {
      // Свайп вправо - предыдущий вопрос (если не первый вопрос)
      setCurrentQuestion(currentQuestion - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[430px] relative">
          {/* Story card */}
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-3xl card-shadow overflow-hidden aspect-[9/16] relative"
            onTouchStart={handleStoryTouchStart}
            onTouchMove={handleStoryTouchMove}
            onTouchEnd={handleStoryTouchEnd}
          >
            {/* Content */}
            <div className="h-full flex flex-col justify-between p-8">
              <div className="flex flex-col items-center text-center mt-12">
                <h2 className="text-2xl font-semibold text-rose-900 mb-6">
                  {welcomeStories[currentStory].title}
                </h2>
                <p className="text-lg text-rose-800/90 mb-8 leading-relaxed">
                  {welcomeStories[currentStory].text}
                </p>
                {welcomeStories[currentStory].link && (
                  <a 
                    href={welcomeStories[currentStory].link?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:text-rose-600 transition-colors text-lg font-medium"
                  >
                    {welcomeStories[currentStory].link?.text}
                  </a>
                )}

                {currentStory === welcomeStories.length - 1 && (
                  <button
                    onClick={() => setIsStarted(true)}
                    className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Начать
                  </button>
                )}
              </div>
              
              <div className="w-full flex flex-col items-center">
                {/* Heart icon with text */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">FeelMe36</h1>
                </div>
                {/* <p className="text-sm text-rose-600/80 mb-5">36 вопросов, чтобы влюбить кого угодно</p> */}
                
                {/* Индикаторы прогресса в нижней части */}
                <div className="flex justify-center gap-1.5 mb-3">
                  {welcomeStories.map((_, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentStory(index)}
                      className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentStory 
                          ? "w-12 bg-rose-400" 
                          : index < currentStory 
                            ? "w-12 bg-rose-300" 
                            : "w-12 bg-rose-200"
                      }`}
                    />
                  ))}
                </div>
                
                {/* Подсказка для свайпа */}
                <p className="text-xs text-rose-400/70">свайпните для навигации</p>
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
        <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-sm p-8 rounded-3xl card-shadow text-center">
          <Eye className="w-16 h-16 mx-auto mb-6 text-rose-500" />
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
            className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-6"
          >
            {showFinalEyeContact ? "Начать сначала" : "Перейти к следующему блоку"}
          </button>
          
          {showFinalEyeContact && (
            <div className="flex flex-col gap-4 mt-6">
              <button
                onClick={() => {
                  const tg = window.Telegram?.WebApp;
                  if (tg) {
                    tg.openTelegramLink('https://t.me/QA_FeelMe36_bot');
                  }
                }}
                className="bg-white text-rose-500 border border-rose-300 px-8 py-3 rounded-full text-base font-medium shadow-sm hover:shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Обратная связь
              </button>
              
              <button
                onClick={() => {
                  const tg = window.Telegram?.WebApp;
                  if (tg) {
                    tg.openLink('https://telegra.ph/36-voprosov-chtoby-vlyubitsya-03-27');
                  }
                }}
                className="text-xs text-rose-500/80 hover:text-rose-600 transition-colors"
              >
                Узнать подробнее про 36 вопросов
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div 
        className="w-full max-w-[430px] bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl card-shadow h-[520px] flex flex-col justify-between"
        onTouchStart={handleQuestionTouchStart}
        onTouchMove={handleQuestionTouchMove}
        onTouchEnd={handleQuestionTouchEnd}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">FeelMe36</h1>
            </div>
            <div className="text-sm font-medium text-rose-600/80">
              Блок {currentSet + 1} из {totalSets}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 flex-1 rounded-full bg-rose-100">
                <div 
                  className="h-full rounded-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questionsPerSet) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-rose-600/80">
                {currentQuestion + 1}/{questionsPerSet}
              </span>
            </div>
            <div className="min-h-[160px] flex items-center">
              <p className="text-xl text-rose-900 leading-relaxed">
                {currentSetQuestions[currentQuestion]}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-rose-400/70 text-center mb-4">свайпните для навигации</div>
          <div className="flex justify-between items-center">
            <button
              onClick={restart}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Начать сначала
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-rose-500 to-rose-400 text-white px-5 py-2 rounded-full flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] text-base"
            >
              {currentQuestion < questionsPerSet - 1 ? (
                <>
                  Следующий
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              ) : (
                'Завершить'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;