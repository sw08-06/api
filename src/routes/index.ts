import express from 'express';
import predictionsRouter from './predictions';
import stressPredictRouter from './stress_predict';
import stressGeneratorRouter from './stress_generator'

const router = express.Router();

router.use('/api/predictions', predictionsRouter);
router.use('/api/stress-predict', stressPredictRouter);
router.use('/api/stress-generator', stressGeneratorRouter);

export default router;
