/**
 * What an equity order would cost at a typical Indian discount broker.
 *
 * Nothing here is charged inside the simulator — the practice capital is not
 * debited these amounts. The point is educational: a beginner who only ever
 * sees a round "₹2,48,959" does not learn that delivery has no brokerage but
 * does have stamp duty, that intraday pays STT only on the sell, or that GST
 * is charged on the charges. So the order ticket shows the breakdown before
 * the order goes in.
 *
 * These rates are published by SEBI, the exchanges and the government and they
 * change. They are gathered here, named and dated, so one edit updates every
 * screen rather than a figure being buried in a component.
 */

/** Rates as published for the 2025-26 financial year. Indicative, not advice. */
export const CHARGE_RATES = {
  ratesAsOf: 'FY 2025-26',
  /** Delivery trades pay no brokerage at a discount broker. */
  brokerageDeliveryRate: 0,
  /** Intraday: the lower of this rate and the cap below, per executed order. */
  brokerageIntradayRate: 0.0003,
  brokerageIntradayCap: 20,
  /** Securities Transaction Tax: delivery both sides, intraday sell side only. */
  sttDeliveryRate: 0.001,
  sttIntradaySellRate: 0.00025,
  /** NSE transaction charges on turnover. */
  exchangeTransactionRate: 0.0000297,
  /** SEBI turnover fee, ₹10 per crore. */
  sebiTurnoverRate: 0.000001,
  /** Stamp duty, buy side only. */
  stampDutyDeliveryRate: 0.00015,
  stampDutyIntradayRate: 0.00003,
  /** GST on brokerage plus exchange and SEBI charges. */
  gstRate: 0.18,
  /** Depository charge on a delivery sell, per scrip per day. */
  dpChargeOnDeliverySell: 15.93,
} as const;

export type TradeSide = 'BUY' | 'SELL';
/** CNC is delivery, MIS is intraday. */
export type TradeProduct = 'CNC' | 'MIS';

export interface ChargeLine {
  label: string;
  amount: number;
  /** Shown as a tooltip or a second line, so the figure is never unexplained. */
  note: string;
}

export interface TradeChargeEstimate {
  turnover: number;
  lines: ChargeLine[];
  totalCharges: number;
  /** What leaves the account on a buy, or lands in it on a sell. */
  netAmount: number;
  ratesAsOf: string;
}

const round = (value: number) => Number(value.toFixed(2));

/**
 * Breaks an order into the charges a real broker would raise.
 *
 * Zero lines are kept rather than dropped — "Brokerage ₹0.00, delivery trades
 * are free" teaches something that an absent row does not.
 */
export function estimateTradeCharges(
  price: number,
  quantity: number,
  side: TradeSide,
  product: TradeProduct,
): TradeChargeEstimate {
  const turnover = round(Math.max(0, price) * Math.max(0, quantity));
  const delivery = product === 'CNC';
  const buying = side === 'BUY';
  const r = CHARGE_RATES;

  const brokerage = delivery
    ? 0
    : round(Math.min(turnover * r.brokerageIntradayRate, r.brokerageIntradayCap));

  const stt = delivery
    ? round(turnover * r.sttDeliveryRate)
    : buying
      ? 0
      : round(turnover * r.sttIntradaySellRate);

  const exchange = round(turnover * r.exchangeTransactionRate);
  const sebi = round(turnover * r.sebiTurnoverRate);

  const stampDuty = buying
    ? round(turnover * (delivery ? r.stampDutyDeliveryRate : r.stampDutyIntradayRate))
    : 0;

  // GST applies to the broker's and the exchange's fees, not to STT or stamp duty.
  const gst = round((brokerage + exchange + sebi) * r.gstRate);

  const dpCharge = delivery && !buying ? r.dpChargeOnDeliverySell : 0;

  const lines: ChargeLine[] = [
    {
      label: 'Brokerage',
      amount: brokerage,
      note: delivery
        ? 'Delivery trades carry no brokerage at a discount broker.'
        : `${(r.brokerageIntradayRate * 100).toFixed(2)}% of turnover, capped at ₹${r.brokerageIntradayCap}.`,
    },
    {
      label: 'STT',
      amount: stt,
      note: delivery
        ? `Securities Transaction Tax, ${(r.sttDeliveryRate * 100).toFixed(3)}% on both sides of a delivery trade.`
        : buying
          ? 'Intraday pays STT on the sell only.'
          : `${(r.sttIntradaySellRate * 100).toFixed(3)}% on an intraday sell.`,
    },
    {
      label: 'Exchange charges',
      amount: exchange,
      note: `NSE transaction charge, ${(r.exchangeTransactionRate * 100).toFixed(4)}% of turnover.`,
    },
    {
      label: 'SEBI turnover fee',
      amount: sebi,
      note: '₹10 per crore of turnover.',
    },
    {
      label: 'Stamp duty',
      amount: stampDuty,
      note: buying
        ? `${(( delivery ? r.stampDutyDeliveryRate : r.stampDutyIntradayRate) * 100).toFixed(3)}% on the buy side.`
        : 'Stamp duty is charged on the buy side only.',
    },
    {
      label: 'GST',
      amount: gst,
      note: `${(r.gstRate * 100).toFixed(0)}% on brokerage, exchange and SEBI charges.`,
    },
  ];

  if (dpCharge > 0) {
    lines.push({
      label: 'DP charge',
      amount: dpCharge,
      note: 'Depository fee on a delivery sell, per company per day.',
    });
  }

  const totalCharges = round(lines.reduce((sum, line) => sum + line.amount, 0));

  return {
    turnover,
    lines,
    totalCharges,
    // Buying costs the turnover plus the charges; selling returns the turnover
    // less the charges.
    netAmount: round(buying ? turnover + totalCharges : turnover - totalCharges),
    ratesAsOf: r.ratesAsOf,
  };
}
