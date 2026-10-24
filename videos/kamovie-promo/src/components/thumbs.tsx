import React from 'react';
import {useCurrentFrame} from 'remotion';
import {arabic, C} from '../theme';
import {LogoMark, PlayIcon} from './graphics';

export type ThumbKind =
	| 'store'
	| 'app'
	| 'brand'
	| 'content'
	| 'food'
	| 'build'
	| 'chart'
	| 'type'
	| 'coffee'
	| 'perfume'
	| 'kamovie';

const Bar: React.FC<{w: string; h: number; c: string; o?: number}> = ({w, h, c, o = 1}) => (
	<div style={{width: w, height: h, borderRadius: h / 2, background: c, opacity: o}} />
);

// Mini "portfolio frames" that stand in for past work in collages and feeds
export const Thumb: React.FC<{kind: ThumbKind; scale?: number}> = ({kind, scale = 1}) => {
	const frame = useCurrentFrame();
	const s = (n: number) => n * scale;
	const fill: React.CSSProperties = {position: 'absolute', inset: 0, overflow: 'hidden'};
	const centered: React.CSSProperties = {...fill, display: 'flex', alignItems: 'center', justifyContent: 'center'};

	switch (kind) {
		case 'store':
			return (
				<div style={{...centered, background: `linear-gradient(160deg, ${C.mustard}, #B9771F)`}}>
					<div style={{position: 'relative', width: s(150), height: s(160), background: C.cream, borderRadius: s(14), boxShadow: '0 12px 24px rgba(0,0,0,0.25)'}}>
						<div style={{position: 'absolute', top: s(-44), left: s(38), width: s(74), height: s(70), border: `${s(10)}px solid ${C.cream}`, borderBottom: 'none', borderRadius: `${s(40)}px ${s(40)}px 0 0`}} />
						<div style={{position: 'absolute', bottom: s(22), left: 0, right: 0, textAlign: 'center', fontFamily: arabic, fontWeight: 900, fontSize: s(30), color: C.burgundy}}>
							٩٩ ر.س
						</div>
					</div>
					<div style={{position: 'absolute', top: s(22), right: s(22), padding: `${s(4)}px ${s(14)}px`, background: C.burgundy, color: C.cream, fontFamily: arabic, fontWeight: 900, fontSize: s(24), borderRadius: s(30)}}>
						خصم
					</div>
				</div>
			);
		case 'app':
			return (
				<div style={{...centered, background: `linear-gradient(180deg, ${C.navy}, #101A33)`}}>
					<div style={{width: s(150), height: s(270), borderRadius: s(26), border: `${s(6)}px solid ${C.cream}`, padding: s(14), display: 'flex', flexDirection: 'column', gap: s(10), boxSizing: 'border-box'}}>
						<div style={{height: s(70), borderRadius: s(12), background: C.mustard}} />
						<Bar w="80%" h={s(12)} c={C.cream} />
						<Bar w="55%" h={s(12)} c={C.cream} o={0.5} />
						<div style={{height: s(46), borderRadius: s(12), background: C.cream, opacity: 0.2}} />
						<div style={{height: s(46), borderRadius: s(12), background: C.cream, opacity: 0.2}} />
					</div>
				</div>
			);
		case 'brand':
			return (
				<div style={{...centered, background: C.cream, flexDirection: 'column', gap: s(16)}}>
					<div style={{width: s(130), height: s(130), borderRadius: '50%', background: C.burgundy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: arabic, fontWeight: 900, fontSize: s(80), color: C.cream, rotate: `${Math.sin(frame / 12) * 6}deg`}}>
						ر
					</div>
					<Bar w={`${s(160)}px`} h={s(14)} c={C.ink} />
					<Bar w={`${s(100)}px`} h={s(10)} c={C.ink} o={0.4} />
				</div>
			);
		case 'content':
			return (
				<div style={{...centered, background: `radial-gradient(circle at 50% 40%, ${C.burgundyLight}, ${C.burgundyDeep})`, flexDirection: 'column', gap: s(18)}}>
					<PlayIcon size={s(110)} color={C.cream} />
					<Bar w={`${s(200)}px`} h={s(16)} c={C.cream} />
					<Bar w={`${s(130)}px`} h={s(12)} c={C.cream} o={0.5} />
				</div>
			);
		case 'food':
			return (
				<div style={{...centered, background: `linear-gradient(200deg, ${C.teal}, #0F3F36)`}}>
					<div style={{width: s(210), height: s(210), borderRadius: '50%', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 30px rgba(0,0,0,0.35)'}}>
						<div style={{width: s(140), height: s(140), borderRadius: '50%', background: '#E9DCC4', position: 'relative'}}>
							{[0, 1, 2, 3, 4].map((i) => (
								<div key={i} style={{position: 'absolute', width: s(36), height: s(36), borderRadius: '50%', background: i % 2 ? '#D8572A' : C.mustard, left: s(52 + Math.cos(i * 1.3) * 38), top: s(52 + Math.sin(i * 1.3) * 38)}} />
							))}
						</div>
					</div>
				</div>
			);
		case 'build':
			return (
				<div style={{...fill, background: 'linear-gradient(180deg, #8FC3DE, #E8E0CF)'}}>
					{[
						[30, 120, 90, 300],
						[130, 70, 110, 350],
						[250, 150, 80, 270],
					].map(([l, t, w, h], i) => (
						<div key={i} style={{position: 'absolute', left: s(l), top: s(t), width: s(w), height: s(h), background: i === 1 ? '#F3EEE6' : '#D6CCBB', boxShadow: 'inset -10px 0 0 rgba(0,0,0,0.08)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 18px, rgba(34,53,94,0.35) 18px 30px)'}} />
					))}
				</div>
			);
		case 'chart':
			return (
				<div style={{...fill, background: '#141012', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: s(14), paddingBottom: s(30), boxSizing: 'border-box'}}>
					{[0.35, 0.55, 0.45, 0.75, 0.95].map((h, i) => (
						<div key={i} style={{width: s(40), height: `${h * 70}%`, borderRadius: s(8), background: i === 4 ? C.burgundyLight : C.cream, opacity: i === 4 ? 1 : 0.75}} />
					))}
				</div>
			);
		case 'type':
			return (
				<div style={{...centered, background: C.ink, flexDirection: 'column'}}>
					<div style={{fontFamily: arabic, fontWeight: 900, fontSize: s(96), color: C.cream, lineHeight: 1}}>حـركـة</div>
					<div style={{marginTop: s(14), width: s(180), height: s(10), background: C.burgundyLight}} />
				</div>
			);
		case 'coffee':
			return (
				<div style={{...centered, background: '#E7D9C2'}}>
					<div style={{position: 'relative', width: s(120), height: s(170), background: C.teal, borderRadius: `${s(10)}px ${s(10)}px ${s(30)}px ${s(30)}px`, boxShadow: '0 14px 26px rgba(0,0,0,0.25)'}}>
						<div style={{position: 'absolute', top: s(-22), left: s(-10), width: s(140), height: s(30), background: '#E9E4DA', borderRadius: s(8)}} />
						<div style={{position: 'absolute', top: s(60), left: 0, right: 0, textAlign: 'center', fontFamily: arabic, fontWeight: 900, fontSize: s(34), color: C.cream}}>
							قهوة
						</div>
					</div>
				</div>
			);
		case 'perfume':
			return (
				<div style={{...centered, background: `linear-gradient(160deg, #5B2A4A, ${C.burgundyDark})`}}>
					<div style={{position: 'relative', width: s(120), height: s(160), borderRadius: s(18), background: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(235,208,138,0.45))', boxShadow: '0 16px 30px rgba(0,0,0,0.4)'}}>
						<div style={{position: 'absolute', top: s(-40), left: s(38), width: s(44), height: s(42), background: C.gold, borderRadius: s(6)}} />
					</div>
				</div>
			);
		case 'kamovie':
			return (
				<div style={{...centered, background: `radial-gradient(circle at 50% 40%, ${C.burgundyLight}, ${C.burgundyDeep} 80%)`}}>
					<LogoMark size={s(200)} />
				</div>
			);
		default:
			return null;
	}
};
