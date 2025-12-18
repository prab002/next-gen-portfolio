'use client';

import { addTrade } from '@/app/actions';
import { useRef } from 'react';

export default function TradeForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function clientAction(formData: FormData) {
    await addTrade(formData);
    formRef.current?.reset();
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Add New Trade</h2>
      <form ref={formRef} action={clientAction} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="symbol">Symbol</label>
            <input className="input" type="text" id="symbol" name="symbol" placeholder="e.g. BTC/USD" required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="type">Type</label>
            <select className="input" id="type" name="type" required>
              <option value="BUY">Long (Buy)</option>
              <option value="SELL">Short (Sell)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="entryDate">Entry Date</label>
            <input className="input" type="datetime-local" id="entryDate" name="entryDate" required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" required>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="entryPrice">Entry Price</label>
            <input className="input" type="number" step="any" id="entryPrice" name="entryPrice" required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="exitPrice">Exit Price</label>
            <input className="input" type="number" step="any" id="exitPrice" name="exitPrice" />
          </div>
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="quantity">Quantity</label>
            <input className="input" type="number" step="any" id="quantity" name="quantity" required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="fees">Fees</label>
            <input className="input" type="number" step="any" id="fees" name="fees" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea className="input" id="notes" name="notes" rows={3}></textarea>
        </div>

        <button type="submit" className="btn btn-primary mt-4">Add Trade</button>
      </form>
    </div>
  );
}
