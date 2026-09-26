import { OptionContract } from '../../../types';

// Black-Scholes approximate Greeks & Pricing simulator for educational exploration
export function generateOptionChain(
  underlying: 'NIFTY' | 'BANKNIFTY',
  spotPrice: number,
  expiryDate: string = 'Current Week Expiry (Thu)'
): OptionContract[] {
  const step = underlying === 'NIFTY' ? 50 : 100;
  const atmBase = Math.round(spotPrice / step) * step;
  
  // Generate 11 strikes around ATM (-5 to +5)
  const contracts: OptionContract[] = [];
  
  for (let i = -6; i <= 6; i++) {
    const strike = atmBase + i * step;
    const distanceRatio = (strike - spotPrice) / spotPrice;
    const isCallITM = spotPrice > strike;
    const isPutITM = strike > spotPrice;
    
    // Base Implied Volatility (IV) %
    const iv = Number((13.5 + Math.abs(distanceRatio) * 18 + (Math.random() * 0.8 - 0.4)).toFixed(2));
    
    // Time to expiry in years (~4 days / 365)
    const t = 4 / 365;
    const r = 0.065; // RBI repo rate 6.5%
    
    // Intrinsic value
    const callIntrinsic = Math.max(0, spotPrice - strike);
    const putIntrinsic = Math.max(0, strike - spotPrice);
    
    // Time value based on IV and distance
    const timeValBase = spotPrice * (iv / 100) * Math.sqrt(t) * 0.4;
    const decayFactor = Math.exp(-Math.pow(distanceRatio * 15, 2));
    const timeValue = Math.max(2.5, timeValBase * decayFactor);
    
    const cePrice = Math.max(1.5, Number((callIntrinsic + timeValue).toFixed(2)));
    const pePrice = Math.max(1.5, Number((putIntrinsic + timeValue * 0.98).toFixed(2)));
    
    // Greeks approximations
    // Delta: ~0.5 ATM, >0.5 ITM, <0.5 OTM
    const zScore = (spotPrice - strike) / (spotPrice * (iv / 100) * Math.sqrt(t));
    const normalCdf = 1 / (1 + Math.exp(-1.6 * zScore));
    
    const ceDelta = Number(Math.max(0.05, Math.min(0.95, normalCdf)).toFixed(2));
    const peDelta = Number(Math.max(-0.95, Math.min(-0.05, ceDelta - 1)).toFixed(2));
    
    const ceGamma = Number((Math.exp(-0.5 * zScore * zScore) / (spotPrice * (iv / 100) * Math.sqrt(t) * Math.sqrt(2 * Math.PI))).toFixed(4));
    const peGamma = ceGamma;
    
    const ceTheta = Number((- (spotPrice * (iv / 100) / (2 * Math.sqrt(t) * 365)) * 0.5 - 2.5).toFixed(2));
    const peTheta = Number((ceTheta * 0.95).toFixed(2));
    
    const ceVega = Number(((spotPrice * Math.sqrt(t) * 0.01) * 0.4).toFixed(2));
    const peVega = ceVega;
    
    // Synthetic OI & Volume
    const oiBase = Math.round(50000 * Math.exp(-Math.abs(distanceRatio) * 8) + 5000);
    const ceOi = Math.round(oiBase * (1 + (i < 0 ? 0.3 : -0.2) + Math.random() * 0.2));
    const peOi = Math.round(oiBase * (1 + (i > 0 ? 0.3 : -0.2) + Math.random() * 0.2));
    
    const ceVolume = Math.round(ceOi * 0.45);
    const peVolume = Math.round(peOi * 0.48);
    
    const ceChange = Number(((Math.random() - 0.48) * 15).toFixed(2));
    const peChange = Number(((Math.random() - 0.52) * 15).toFixed(2));
    
    contracts.push({
      strikePrice: strike,
      expiryDate,
      underlyingSymbol: underlying,
      ceLtp: cePrice,
      ceChange,
      ceChangePercent: Number(((ceChange / (cePrice - ceChange || 1)) * 100).toFixed(2)),
      ceOi,
      ceVolume,
      ceIv: iv,
      ceDelta,
      ceGamma,
      ceTheta,
      ceVega,
      peLtp: pePrice,
      peChange,
      peChangePercent: Number(((peChange / (pePrice - peChange || 1)) * 100).toFixed(2)),
      peOi,
      peVolume,
      peIv: Number((iv * 1.02).toFixed(2)),
      peDelta,
      peGamma,
      peTheta,
      peVega
    });
  }
  
  return contracts;
}
