// LazyMotion が後から読み込む機能。layout は使わないため domAnimation で足りる（https://motion.dev/docs/react-reduce-bundle-size ）
import { domAnimation } from "motion/react";

export default domAnimation;
