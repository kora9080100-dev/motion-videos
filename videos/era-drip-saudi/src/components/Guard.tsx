import React from 'react';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Honour guard in white thobe, dark bisht with gold trim, red shemagh and black agal.
// Side view facing right. `raise` 0 = sword lowered, 1 = sword raised upright in
// salute. Feet at (0,0), height ~180 units.
export const Guard: React.FC<{height: number; raise: number; flip?: boolean; shade?: number}> = ({
	height,
	raise,
	flip = false,
	shade = 0.85,
}) => {
	const elbow: [number, number] = [lerp(14, 30, raise), lerp(-108, -124, raise)];
	const hand: [number, number] = [lerp(18, 25, raise), lerp(-86, -150, raise)];
	const ang = lerp(152, 3, raise) * (Math.PI / 180);
	const blade = 78;
	const tip: [number, number] = [hand[0] + Math.sin(ang) * blade, hand[1] - Math.cos(ang) * blade];
	const bend: [number, number] = [
		(hand[0] + tip[0]) / 2 + Math.cos(ang) * 7,
		(hand[1] + tip[1]) / 2 + Math.sin(ang) * 7,
	];
	const gx = Math.cos(ang) * 8;
	const gy = Math.sin(ang) * 8;
	const pid = `shm-${Math.round(height)}`;
	return (
		<svg
			width={(height * 120) / 200}
			height={height}
			viewBox="-60 -200 120 200"
			style={{
				overflow: 'visible',
				transform: flip ? 'scaleX(-1)' : undefined,
				filter: `brightness(${shade}) drop-shadow(${flip ? 2 : -2}px 0 0 rgba(255,200,120,0.75))`,
			}}
		>
			<defs>
				<pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
					<rect width="6" height="6" fill="#b3262d" />
					<path d="M0 3H6M3 0V6" stroke="#f3e9e0" strokeWidth="0.9" opacity="0.55" />
				</pattern>
			</defs>
			{/* thobe */}
			<path d="M-16 -140 C-22 -100 -26 -50 -28 0 L23 0 C22 -50 21 -100 18 -138 C9 -147 -8 -147 -16 -140Z" fill="#efe9dd" />
			{/* bisht over the back, open at the front */}
			<path d="M-21 -142 C-33 -100 -39 -50 -41 0 L3 0 C2 -50 1 -100 5 -141 C-2 -148 -14 -148 -21 -142Z" fill="#2b1c15" />
			<path d="M3 0 C2 -50 1 -100 5 -141" fill="none" stroke="#d9a94a" strokeWidth="2.6" />
			{/* neck and face profile with beard */}
			<path
				d="M-2 -144 L9 -145 L10 -151 C13 -152 15 -154 15 -157 L18 -160 C18 -163 16 -165 15 -167 C14 -172 6 -175 -1 -172Z"
				fill="#b8825c"
			/>
			<path d="M0 -146 C7 -145 12 -149 15 -155 C12 -153 8 -152 4 -152 C3 -150 1 -148 0 -146Z" fill="#1c1310" />
			{/* shemagh: over the head, framing the face, falling to the shoulders */}
			<path
				d="M15 -168 C15 -177 6 -181 -4 -180 C-13 -179 -17 -171 -19 -160 C-21 -150 -25 -138 -30 -127 L-9 -133 C-5 -142 0 -152 2 -160 C4 -164 10 -166 15 -168Z"
				fill={`url(#${pid})`}
			/>
			{/* agal */}
			<path d="M14 -171 C8 -177 -6 -177 -13 -171" fill="none" stroke="#121010" strokeWidth="3.4" strokeLinecap="round" />
			<path d="M13 -174.5 C7 -180 -5 -180 -11 -174.5" fill="none" stroke="#121010" strokeWidth="2.6" strokeLinecap="round" />
			{/* arm in the bisht sleeve */}
			<path
				d={`M2 -134 L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`}
				fill="none"
				stroke="#2b1c15"
				strokeWidth={11}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx={hand[0]} cy={hand[1]} r="4.6" fill="#b8825c" />
			{/* sword */}
			<path
				d={`M${hand[0]} ${hand[1]} Q${bend[0]} ${bend[1]} ${tip[0]} ${tip[1]}`}
				fill="none"
				stroke="#efeae0"
				strokeWidth={3.2}
				strokeLinecap="round"
			/>
			<line x1={hand[0] - gx} y1={hand[1] - gy} x2={hand[0] + gx} y2={hand[1] + gy} stroke="#d9a94a" strokeWidth={3.6} strokeLinecap="round" />
		</svg>
	);
};
