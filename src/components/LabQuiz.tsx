import { Award, CheckCircle2, XCircle, HelpCircle, ArrowRight, Sparkles, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { QUIZ_QUESTIONS } from '../data/physicsData';
import confetti from 'canvas-confetti';

interface Props {
  lang: Language;
}

export default function LabQuiz({ lang }: Props) {
  const { t: tI18n } = useTranslation();
  const t = (tI18n('challenges', { returnObjects: true }) as any);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentIndex];
  const total = QUIZ_QUESTIONS.length;

  const handleSelect = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
    if (selectedOption === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setIsFinished(false);
  };

  const questionText = tI18n(`quiz.${question.id}.question`);
  const options = (tI18n(`quiz.${question.id}.options`, { returnObjects: true }) as string[]) || [];
  const explanation = tI18n(`quiz.${question.id}.explanation`);

  return (
    <div id="quiz-view" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            {t.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">{t.description}</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono">
          <span className="text-zinc-400">{t.score}:</span>
          <span className="font-bold text-emerald-400">{score}</span>
          <span className="text-zinc-500">/ {total}</span>
        </div>
      </div>

      {!isFinished ? (
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {lang === 'ar' 
                ? `السؤال ${currentIndex + 1} من ${total}` 
                : lang === 'bad'
                ? `پرسیارا ${currentIndex + 1} ژ ${total}`
                : lang === 'ku'
                ? `پرسیاری ${currentIndex + 1} لە ${total}`
                : lang === 'kmr'
                ? `Pirsa ${currentIndex + 1} ji ${total}`
                : `Question ${currentIndex + 1} of ${total}`}
            </span>
            <span className="font-mono capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              {question.experiment}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
              {questionText}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === question.correctIndex;

              let btnStyle = 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700';

              if (isAnswerChecked) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-medium';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-200';
                } else {
                  btnStyle = 'bg-zinc-900/40 border-zinc-800 text-zinc-500';
                }
              } else if (isSelected) {
                btnStyle = 'bg-sky-500/20 border-sky-500 text-sky-200 font-medium';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswerChecked}
                  className={`w-full p-4 rounded-xl border text-xs sm:text-sm text-start flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswerChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                  {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerChecked && (
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5 text-xs">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                {t.explanation}
              </span>
              <p className="text-zinc-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end pt-2">
            {!isAnswerChecked ? (
              <button
                onClick={handleCheck}
                disabled={selectedOption === null}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-medium text-xs shadow-md transition-all"
              >
                {t.checkAnswer}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-medium text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>{t.next}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Finished Summary */
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-100">
              {score === total ? t.perfectScore : score >= total / 2 ? t.goodScore : t.keepTrying}
            </h3>
            <p className="text-sm text-zinc-400 font-mono">
              {lang === 'ar' 
                ? `نتيجتك النهائية: ${score} من ${total}` 
                : lang === 'bad'
                ? `ئەنجامێ تە یێ دووماهییێ: ${score} ژ ${total}`
                : lang === 'ku'
                ? `ئەنجامی کۆتاییت: ${score} لە ${total}`
                : `Final Score: ${score} out of ${total}`} (
              {Math.round((score / total) * 100)}%)
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium inline-flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.restart}</span>
          </button>
        </div>
      )}
    </div>
  );
}