import React, { useState } from 'react';
import { Heart, Eye, ChevronRight, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { questions } from './questions';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showEyeContact, setShowEyeContact] = useState(false);
  const [showFinalEyeContact, setShowFinalEyeContact] = useState(false);
  const [currentStory, setCurrentStory] = useState(0);

  const welcomeStories = [
    {
      title: "Добро пожаловать в 36Q",
      text: "Перед вами набор из 36 вопросов, призванных сблизить вас и вашего партнера. Вопросы разбиты на три блока, с каждым блоком вопросы все более глубокие и откровенные."
    },
    {
      title: "Выделите время",
      text: "Выделите время с партнером, когда вас никто не будет отвлекать. Отвечайте по очереди на каждый вопрос."
    },
    {
      title: "Зрительный контакт",
      text: "Когда заканчивается блок вопросов, оставайтесь в тишине, и просто смотрите друг другу в глаза от 1 до 4 минут. Это усилит ощущение вашей близости."
    }
  ];

  const totalSets = 3;
  const questionsPerSet = 12;
  const currentSetQuestions = questions.slice(
    currentSet * questionsPerSet,
    (currentSet + 1) * questionsPerSet
  );

  const handleNext = () => {
    if (currentQuestion < questionsPerSet - 1) {
      setCurrentQuestion(currentQuestion + 1);
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
          {/* Progress indicators */}
          <div className="absolute top-6 left-0 right-0 z-10 flex justify-center gap-1.5">
            {welcomeStories.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentStory 
                    ? "w-12 bg-rose-400" 
                    : index < currentStory 
                      ? "w-12 bg-rose-300" 
                      : "w-12 bg-rose-200"
                }`}
              />
            ))}
          </div>

          {/* Story card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl card-shadow overflow-hidden aspect-[9/16] relative">
            {/* Header with logo */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-white via-white/80 to-transparent">
              <div className="flex items-center gap-3">
                <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">36Q</h1>
                  <p className="text-sm text-rose-600/80">36 вопросов, чтобы влюбить кого угодно</p>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={prevStory}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 backdrop-blur-sm text-rose-500 shadow-lg transition-all ${
                currentStory === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-rose-50'
              }`}
              disabled={currentStory === 0}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextStory}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 backdrop-blur-sm text-rose-500 shadow-lg transition-all ${
                currentStory === welcomeStories.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-rose-50'
              }`}
              disabled={currentStory === welcomeStories.length - 1}
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="h-full flex flex-col justify-center p-8 text-center pt-28">
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
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl card-shadow">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">36Q</h1>
          </div>
          <div className="text-sm font-medium text-rose-600/80">
            Блок {currentSet + 1} из {totalSets}
          </div>
        </div>

        <div className="mb-8">
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
          <p className="text-xl text-rose-900 leading-relaxed">
            {currentSetQuestions[currentQuestion]}
          </p>
        </div>

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