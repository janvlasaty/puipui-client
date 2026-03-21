import { useState, useMemo } from 'react'
import { CoinsIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { ModalCard } from '../ui/ModalCard'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CZK', 'PLN', 'HUF', 'CHF', 'SEK', 'NOK', 'DKK', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL']

export interface Participant {
  id: string
  name: string
}

interface CreateExpenseModalProps {
  onClose: () => void
  onSend: (content: string) => void
  participants?: Participant[]
}

export const CreateExpenseModal = ({ onClose, onSend, participants }: CreateExpenseModalProps) => {
  const { t } = useTranslation()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [direction, setDirection] = useState<'lent' | 'borrowed'>('lent')
  const [included, setIncluded] = useState<Record<string, boolean>>(
    () => Object.fromEntries((participants ?? []).map((p) => [p.id, true]))
  )
  const [shares, setShares] = useState<Record<string, number>>(
    () => Object.fromEntries((participants ?? []).map((p) => [p.id, 1]))
  )

  const includedParticipants = (participants ?? []).filter((p) => included[p.id])
  const totalShares = includedParticipants.reduce((sum, p) => sum + (shares[p.id] ?? 1), 0)
  const parsedAmount = parseFloat(amount)

  const splits = useMemo(() =>
    includedParticipants.map((p) => ({
      userId: p.id,
      name: p.name,
      share: shares[p.id] ?? 1,
      amount: totalShares > 0 && !isNaN(parsedAmount)
        ? (parsedAmount * (shares[p.id] ?? 1)) / totalShares
        : 0,
    })),
    [includedParticipants, shares, totalShares, parsedAmount]
  )

  const canSend = description.trim().length > 0 && !isNaN(parsedAmount) && parsedAmount > 0

  const handleSend = () => {
    onSend(JSON.stringify({
      description: description.trim(),
      amount: parsedAmount,
      currency,
      direction,
      ...(participants ? { splits: splits.map(({ userId, name, share }) => ({ userId, name, share })) } : {}),
    }))
    onClose()
  }

  return (
    <ModalCard
      icon={<CoinsIcon size={18} className="text-primary" />}
      title={t('expense.addExpense')}
      onClose={onClose}
    >
      <div className="p-5 pt-4 space-y-4">
        <div className="flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setDirection('lent')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${direction === 'lent' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          >
            {t('expense.iLent')}
          </button>
          <button
            onClick={() => setDirection('borrowed')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${direction === 'borrowed' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          >
            {t('expense.iBorrowed')}
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
            {t('expense.forWhat')}
          </label>
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('expense.forWhatPlaceholder')}
            className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
              {t('expense.amount')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
              {t('expense.currency')}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {participants && participants.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">
              {t('expense.splitBetween')}
            </label>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setIncluded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-colors ${included[p.id] ? 'bg-primary border-primary' : 'border-border'}`}
                  >
                    {included[p.id] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${!included[p.id] ? 'text-muted-foreground' : ''}`}>{p.name}</span>
                  {included[p.id] && (
                    <>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={shares[p.id] ?? 1}
                          onChange={(e) => setShares((prev) => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-12 px-2 py-1 rounded-lg bg-muted text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-xs text-muted-foreground">pt</span>
                      </div>
                      {!isNaN(parsedAmount) && parsedAmount > 0 && totalShares > 0 && (
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {((parsedAmount * (shares[p.id] ?? 1)) / totalShares).toFixed(2)} {currency}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          disabled={!canSend}
          onClick={handleSend}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          {t('expense.sendExpense')}
        </button>
      </div>
    </ModalCard>
  )
}

