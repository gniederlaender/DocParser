import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { databaseService, LoanOfferRecord } from '../services/databaseService';

const router = express.Router();

// GET /api/admin/offers - Get all loan offers
router.get('/admin/offers', asyncHandler(async (req: Request, res: Response) => {
  const offers = await databaseService.getInstance().getAllLoanOffers();

  res.json({
    success: true,
    data: offers
  });
}));

// GET /api/admin/offers/:id - Get single loan offer by ID
router.get('/admin/offers/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const offerId = parseInt(id, 10);

  if (isNaN(offerId)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid offer ID'
      }
    });
    return;
  }

  const offer = await databaseService.getInstance().getLoanOfferById(offerId);

  if (!offer) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Offer with ID ${id} not found`
      }
    });
    return;
  }

  res.json({
    success: true,
    data: offer
  });
}));

// POST /api/admin/offers - Create new loan offer
router.post('/admin/offers', asyncHandler(async (req: Request, res: Response) => {
  const offerData: Partial<LoanOfferRecord> = req.body;

  // Validate required fields
  if (!offerData.fileName) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'fileName is required'
      }
    });
    return;
  }

  // Create new offer record
  const newOffer: LoanOfferRecord = {
    fileName: offerData.fileName,
    anbieter: offerData.anbieter || undefined,
    angebotsdatum: offerData.angebotsdatum || undefined,
    kreditbetrag: offerData.kreditbetrag || undefined,
    auszahlungsbetrag: offerData.auszahlungsbetrag || undefined,
    auszahlungsdatum: offerData.auszahlungsdatum || undefined,
    datum1Rate: offerData.datum1Rate || undefined,
    laufzeit: offerData.laufzeit || undefined,
    ratenanzahl: offerData.ratenanzahl || undefined,
    kreditende: offerData.kreditende || undefined,
    sondertilgungen: offerData.sondertilgungen || undefined,
    restwert: offerData.restwert || undefined,
    fixzinssatz: offerData.fixzinssatz || undefined,
    fixzinsperiode: offerData.fixzinsperiode || undefined,
    fixzinssatz_in_jahren: offerData.fixzinssatz_in_jahren || undefined,
    sollzinssatz: offerData.sollzinssatz || undefined,
    effektivzinssatz: offerData.effektivzinssatz || undefined,
    bearbeitungsgebuehr: offerData.bearbeitungsgebuehr || undefined,
    schaetzgebuehr: offerData.schaetzgebuehr || undefined,
    kontofuehrungsgebuehr: offerData.kontofuehrungsgebuehr || undefined,
    kreditpruefkosten: offerData.kreditpruefkosten || undefined,
    vermittlerentgelt: offerData.vermittlerentgelt || undefined,
    grundbucheintragungsgebuehr: offerData.grundbucheintragungsgebuehr || undefined,
    grundbuchseingabegebuehr: offerData.grundbuchseingabegebuehr || undefined,
    grundbuchsauszug: offerData.grundbuchsauszug || undefined,
    grundbuchsgesuch: offerData.grundbuchsgesuch || undefined,
    legalisierungsgebuehr: offerData.legalisierungsgebuehr || undefined,
    gesamtkosten: offerData.gesamtkosten || undefined,
    gesamtbetrag: offerData.gesamtbetrag || undefined,
    monatsrate: offerData.monatsrate || undefined,
    rawJson: offerData.rawJson || JSON.stringify(offerData),
    processingTime: offerData.processingTime || 0,
    confidence: offerData.confidence || 1.0
  };

  const result = await databaseService.getInstance().saveLoanOffers([newOffer]);

  if (!result.success) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: result.error || 'Failed to create offer'
      }
    });
    return;
  }

  // Get the created offer (we'll need to fetch it since saveLoanOffers doesn't return the ID)
  // For simplicity, we'll return success and the client can refresh the list
  res.status(201).json({
    success: true,
    message: 'Offer created successfully',
    data: {
      savedCount: result.savedCount
    }
  });
}));

// PUT /api/admin/offers/:id - Update existing loan offer
router.put('/admin/offers/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const offerId = parseInt(id, 10);
  const updateData: Partial<LoanOfferRecord> = req.body;

  if (isNaN(offerId)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid offer ID'
      }
    });
    return;
  }

  // Remove fields that shouldn't be updated directly
  delete updateData.id;
  delete updateData.createdAt;

  const result = await databaseService.getInstance().updateLoanOffer(offerId, updateData);

  if (!result.success) {
    res.status(404).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: result.error || 'Failed to update offer'
      }
    });
    return;
  }

  // Fetch updated offer
  const updatedOffer = await databaseService.getInstance().getLoanOfferById(offerId);

  res.json({
    success: true,
    message: 'Offer updated successfully',
    data: updatedOffer
  });
}));

export default router;

