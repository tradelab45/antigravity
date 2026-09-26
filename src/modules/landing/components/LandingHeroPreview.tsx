import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Check, ReceiptIndianRupee, Wallet } from 'lucide-react';
import { estimateTradeCharges } from '../../../utils/tradeCharges';
import { LEARNING_PATH } from '../../academy/data/learningPath';

export interface PreviewShare {
  symbol: string;
  name: string;
  price: number;
}

interface LandingHeroPreviewProps {
  share: PreviewShare;
  /** Where `share.price` came from; anything but a quote is labelled an example. */
  quoteStatus?: 'live' | 'delayed' | 'simulated' | 'unavailable';
  reduced: boolean;
}

/** Shares in the example order. Small enough to be a sensible first trade. */
const EXAMPLE_QUANTITY = 10;

const rupees = (value: number, digits = 2) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

/**
 * The landing page's hero picture: three cards from the app itself.
 *
 * This replaced a spinning 3D rupee coin that sat in the middle of a
 * candlestick chart with "click coin to flip" beneath it, beside a card
 * announcing "NIFTY 50 breakout ₹23,346.4" — a number typed into the source
 * and shown as if it were the market. The cards say what the simulator
 * actually is, and every figure in them is either real or labelled as an
 * example: the order ticket names where its price came from and says
 * "example price" when the feed has not answered, and the broker costs come from the same
 * model the order ticket inside the app uses. The live index levels already
 * sit in the bar directly beneath the hero, so they are not repeated here.
 */
export const LandingHeroPreview: React.FC<LandingHeroPreviewProps> = ({ share, quoteStatus, reduced }) => {
  const charges = useMemo(
    () => estimateTradeCharges(share.price, EXAMPLE_QUANTITY, 'BUY', 'CNC'),
    [share.price],
  );

  const priceLabel =
    quoteStatus === 'live' ? 'Live price' : quoteStatus === 'delayed' ? 'Delayed price' : 'Example price';

  const firstStage = LEARNING_PATH[0];
  const lastStage = LEARNING_PATH[LEARNING_PATH.length - 1];

  const enter = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <figure className="rr-preview" aria-label="A preview of the RupeeRookie app">
      <motion.section className="rr-preview-card rr-preview-portfolio" {...enter(0.05)}>
        <p className="rr-preview-eyebrow">
          <Wallet size={14} aria-hidden="true" /> Practice portfolio
        </p>
        <p className="rr-preview-figure">₹10,00,000</p>
        <p className="rr-preview-caption">Virtual capital, yours from the first minute.</p>
        <ul className="rr-preview-checks">
          <li><Check size={14} aria-hidden="true" /> NSE prices from a market feed</li>
          <li><Check size={14} aria-hidden="true" /> What a real broker would charge, shown</li>
          <li><Check size={14} aria-hidden="true" /> Nothing you can lose</li>
        </ul>
      </motion.section>

      <motion.section className="rr-preview-card rr-preview-ticket" {...enter(0.18)}>
        <p className="rr-preview-eyebrow">
          <ReceiptIndianRupee size={14} aria-hidden="true" /> Order ticket
          <span className="rr-preview-tag">{priceLabel}</span>
        </p>
        <p className="rr-preview-order">
          Buy {EXAMPLE_QUANTITY} × <strong>{share.symbol}</strong>
        </p>
        <dl className="rr-preview-rows">
          <div><dt>Price</dt><dd>{rupees(share.price)}</dd></div>
          <div><dt>Order value</dt><dd>{rupees(charges.turnover)}</dd></div>
          <div><dt>At a real broker</dt><dd>+ {rupees(charges.totalCharges)}</dd></div>
          <div className="rr-preview-total"><dt>Here</dt><dd>₹0 · practice money</dd></div>
        </dl>
      </motion.section>

      <motion.section className="rr-preview-card rr-preview-academy" {...enter(0.3)}>
        <p className="rr-preview-eyebrow">
          <BookOpen size={14} aria-hidden="true" /> Investor Academy
        </p>
        <p className="rr-preview-academy-title">
          {LEARNING_PATH.length} stages, {firstStage.name} to {lastStage.name}
        </p>
        <ol className="rr-preview-stages" aria-label="Academy stages">
          {LEARNING_PATH.map((stage, position) => (
            <li key={stage.id} className={position === 0 ? 'rr-preview-stage-open' : undefined}>
              <span className="sr-only">{stage.name}</span>
            </li>
          ))}
        </ol>
        <p className="rr-preview-caption">Pass a stage exam to open the next one.</p>
      </motion.section>
    </figure>
  );
};

export default LandingHeroPreview;
