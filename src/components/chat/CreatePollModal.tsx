import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChartBarHorizontalIcon, PlusIcon, XIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { ModalCard } from '../ui/ModalCard'

interface CreatePollModalProps {
  onClose: () => void
  onSend: (content: string) => void
}

export const CreatePollModal = ({ onClose, onSend }: CreatePollModalProps) => {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiSelect, setMultiSelect] = useState(false)

  const validOptions = options.filter((o) => o.trim())
  const canSend = question.trim().length > 0 && validOptions.length >= 2

  const handleSend = () => {
    onSend(JSON.stringify({
      question: question.trim(),
      options: validOptions,
      multiSelect,
    }))
    onClose()
  }

  const updateOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, j) => (j === i ? value : o)))

  const removeOption = (i: number) =>
    setOptions((prev) => prev.filter((_, j) => j !== i))

  return (
    <ModalCard
      icon={<ChartBarHorizontalIcon size={18} className="text-primary" />}
      title={t('poll.createPoll')}
      onClose={onClose}
    >
      <div className="p-5 pt-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
            {t('poll.question')}
          </label>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('poll.questionPlaceholder')}
            className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
            {t('poll.answers')}
          </label>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {options.map((opt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={t('poll.optionPlaceholder', { n: i + 1 })}
                    className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <XIcon size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {options.length < 6 && (
            <button
              onClick={() => setOptions((prev) => [...prev, ''])}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium"
            >
              <PlusIcon size={13} />
              {t('poll.addOption')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('poll.multipleAnswers')}</p>
            <p className="text-xs text-muted-foreground">{t('poll.allowMultiple')}</p>
          </div>
          <button
            onClick={() => setMultiSelect((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${multiSelect ? 'bg-primary' : 'bg-muted'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${multiSelect ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <button
          disabled={!canSend}
          onClick={handleSend}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {t('poll.sendPoll')}
        </button>
      </div>
    </ModalCard>
  )
}

