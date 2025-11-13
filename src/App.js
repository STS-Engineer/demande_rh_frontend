import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import './DemandeRHForm.css';

// URL de l'API - utilise la variable d'environnement en production, localhost en développement
const API_BASE_URL = 'https://hr-back.azurewebsites.net';

export default function DemandeRHForm() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    employe_id: '',
    type_demande: '',
    titre: '',
    date_depart: '',
    date_retour: '',
    heure_depart: '',
    heure_retour: '',
    demi_journee: false,
    type_conge: '',
    type_conge_autre: '',
    frais_deplacement: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/actifs`);
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires
    if (!formData.employe_id) newErrors.employe_id = 'Veuillez sélectionner un employé';
    if (!formData.type_demande) newErrors.type_demande = 'Veuillez sélectionner un type de demande';
    if (!formData.titre.trim()) newErrors.titre = 'Veuillez saisir le motif de la demande';
    if (!formData.date_depart) newErrors.date_depart = 'Veuillez saisir la date de départ';

    // Validation conditionnelle selon le type de demande
    if (formData.type_demande === 'conges' || formData.type_demande === 'mission') {
      if (!formData.date_retour) newErrors.date_retour = 'Veuillez saisir la date de retour';
      
      // Validation des dates
      if (formData.date_depart && formData.date_retour) {
        const dateDepart = new Date(formData.date_depart);
        const dateRetour = new Date(formData.date_retour);
        if (dateRetour < dateDepart) {
          newErrors.date_retour = 'La date de retour doit être après la date de départ';
        }
      }
    }

    if (formData.type_demande === 'conges' && !formData.type_conge) {
      newErrors.type_conge = 'Veuillez sélectionner un type de congé';
    }

    // Si "Autre" est choisi, le champ texte est obligatoire
    if (formData.type_demande === 'conges' && formData.type_conge === 'autre') {
      if (!formData.type_conge_autre || !formData.type_conge_autre.trim()) {
        newErrors.type_conge_autre = 'Veuillez préciser le type de congé';
      }
    }

    if (formData.type_demande === 'autorisation') {
      if (!formData.heure_depart) newErrors.heure_depart = 'Veuillez saisir l\'heure de départ';
      if (!formData.heure_retour) newErrors.heure_retour = 'Veuillez saisir l\'heure d\'arrivée';
      
      // Validation des heures
      if (formData.heure_depart && formData.heure_retour) {
        if (formData.heure_retour <= formData.heure_depart) {
          newErrors.heure_retour = 'L\'heure d\'arrivée doit être après l\'heure de départ';
        }
      }
    }

    if (formData.type_demande === 'mission') {
      if (!formData.heure_depart) newErrors.heure_depart = 'Veuillez saisir l\'heure de sortie';
      if (!formData.heure_retour) newErrors.heure_retour = 'Veuillez saisir l\'heure de retour';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour l'envoi
      const dataToSend = {
        ...formData,
        // Convertir les chaînes vides en null pour les champs optionnels
        date_retour: formData.date_retour || null,
        heure_depart: formData.heure_depart || null,
        heure_retour: formData.heure_retour || null,
        frais_deplacement: formData.frais_deplacement ? parseFloat(formData.frais_deplacement) : null,
        type_conge: formData.type_conge || null,
        type_conge_autre:
          formData.type_conge === 'autre' && formData.type_conge_autre
            ? formData.type_conge_autre.trim()
            : null,
        demi_journee: formData.demi_journee || false
      };

      const response = await fetch(`${API_BASE_URL}/api/demandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          // Réinitialiser le formulaire
          setFormData({
            employe_id: '',
            type_demande: '',
            titre: '',
            date_depart: '',
            date_retour: '',
            heure_depart: '',
            heure_retour: '',
            demi_journee: false,
            type_conge: '',
            type_conge_autre: '',
            frais_deplacement: ''
          });
        }, 4000);
      } else {
        alert(result.error || 'Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Réinitialiser les champs conditionnels quand le type de demande change
  const handleTypeDemandeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type_demande: value,
      // Réinitialiser les champs spécifiques au type précédent
      date_retour: '',
      heure_depart: '',
      heure_retour: '',
      demi_journee: false,
      type_conge: '',
      type_conge_autre: '',
      frais_deplacement: ''
    }));
    setErrors(prev => ({
      ...prev,
      date_retour: '',
      heure_depart: '',
      heure_retour: '',
      type_conge: '',
      type_conge_autre: ''
    }));
  };

  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle className="success-icon" />
          <h2 className="success-title">Demande envoyée !</h2>
          <p className="success-message">
            Votre demande a été transmise à votre responsable hiérarchique.
            <br />Vous recevrez une notification par email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="demande-container">
      <div className="demande-form-wrapper">
        <div className="demande-card">
          <div className="demande-header">
            <h1 className="demande-title">Demande RH</h1>
            <p className="demande-subtitle">Remplissez le formulaire ci-dessous</p>
          </div>

          <div className="demande-body">
            {/* Type de Demande */}
            <div className="form-section">
              <label className="form-label">
                <FileText className="form-label-icon" />
                Type de Demande *
              </label>
              <select
                value={formData.type_demande}
                onChange={(e) => handleTypeDemandeChange(e.target.value)}
                className={`form-select ${errors.type_demande ? 'error' : ''}`}
              >
                <option value="">Sélectionnez un type</option>
                <option value="autorisation">Autorisation</option>
                <option value="conges">Congés</option>
                <option value="mission">Mission</option>
              </select>
              {errors.type_demande && <div className="error-message"><AlertCircle size={16} /> {errors.type_demande}</div>}
            </div>

            {/* Employé */}
            <div className="form-section">
              <label className="form-label">
                <User className="form-label-icon" />
                Employé *
              </label>
              <select
                value={formData.employe_id}
                onChange={(e) => handleInputChange('employe_id', e.target.value)}
                className={`form-select ${errors.employe_id ? 'error' : ''}`}
              >
                <option value="">Sélectionnez votre nom</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom} {emp.prenom} - {emp.poste}
                  </option>
                ))}
              </select>
              {errors.employe_id && <div className="error-message"><AlertCircle size={16} /> {errors.employe_id}</div>}
            </div>

            {/* Motif */}
            <div className="form-section">
              <label className="form-label">
                Motif de la demande *
              </label>
              <textarea
                value={formData.titre}
                onChange={(e) => handleInputChange('titre', e.target.value)}
                rows="3"
                placeholder="Décrivez le motif de votre demande..."
                className={`form-textarea ${errors.titre ? 'error' : ''}`}
              />
              {errors.titre && <div className="error-message"><AlertCircle size={16} /> {errors.titre}</div>}
            </div>

            {/* Dates */}
            <div className="form-grid">
              <div className="form-section">
                <label className="form-label">
                  <Calendar className="form-label-icon" />
                  Date de départ *
                </label>
                <input
                  type="date"
                  value={formData.date_depart}
                  onChange={(e) => handleInputChange('date_depart', e.target.value)}
                  className={`form-input ${errors.date_depart ? 'error' : ''}`}
                />
                {errors.date_depart && <div className="error-message"><AlertCircle size={16} /> {errors.date_depart}</div>}
              </div>

              {(formData.type_demande === 'conges' || formData.type_demande === 'mission') && (
                <div className="form-section">
                  <label className="form-label">
                    <Calendar className="form-label-icon" />
                    Date de retour *
                  </label>
                  <input
                    type="date"
                    value={formData.date_retour}
                    onChange={(e) => handleInputChange('date_retour', e.target.value)}
                    className={`form-input ${errors.date_retour ? 'error' : ''}`}
                  />
                  {errors.date_retour && <div className="error-message"><AlertCircle size={16} /> {errors.date_retour}</div>}
                </div>
              )}
            </div>

            {formData.type_demande === 'conges' && (
              <>
                <div className="form-checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.demi_journee}
                      onChange={(e) => handleInputChange('demi_journee', e.target.checked)}
                      className="checkbox-input"
                    />
                    Demi-journée
                  </label>
                </div>

                <div className="form-section">
                  <label className="form-label">
                    Type de congé *
                  </label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="annuel"
                        checked={formData.type_conge === 'annuel'}
                        onChange={(e) => handleInputChange('type_conge', e.target.value)}
                        className="radio-input"
                      />
                      Congé annuel
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="sans_solde"
                        checked={formData.type_conge === 'sans_solde'}
                        onChange={(e) => handleInputChange('type_conge', e.target.value)}
                        className="radio-input"
                      />
                      Congé sans solde
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="autre"
                        checked={formData.type_conge === 'autre'}
                        onChange={(e) => handleInputChange('type_conge', e.target.value)}
                        className="radio-input"
                      />
                      Autre (à préciser)
                    </label>
                  </div>

                  {formData.type_conge === 'autre' && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        value={formData.type_conge_autre}
                        onChange={(e) => handleInputChange('type_conge_autre', e.target.value)}
                        placeholder="Précisez le type de congé"
                        className={`form-input ${errors.type_conge_autre ? 'error' : ''}`}
                      />
                      {errors.type_conge_autre && (
                        <div className="error-message">
                          <AlertCircle size={16} /> {errors.type_conge_autre}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.type_conge && <div className="error-message"><AlertCircle size={16} /> {errors.type_conge}</div>}
                </div>
              </>
            )}

            {formData.type_demande === 'autorisation' && (
              <div className="form-grid">
                <div className="form-section">
                  <label className="form-label">
                    <Clock className="form-label-icon" />
                    Heure de départ *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_depart}
                    onChange={(e) => handleInputChange('heure_depart', e.target.value)}
                    className={`form-input ${errors.heure_depart ? 'error' : ''}`}
                  />
                  {errors.heure_depart && <div className="error-message"><AlertCircle size={16} /> {errors.heure_depart}</div>}
                </div>
                <div className="form-section">
                  <label className="form-label">
                    <Clock className="form-label-icon" />
                    Heure d'arrivée *
                  </label>
                  <input
                    type="time"
                    value={formData.heure_retour}
                    onChange={(e) => handleInputChange('heure_retour', e.target.value)}
                    className={`form-input ${errors.heure_retour ? 'error' : ''}`}
                  />
                  {errors.heure_retour && <div className="error-message"><AlertCircle size={16} /> {errors.heure_retour}</div>}
                </div>
              </div>
            )}

            {formData.type_demande === 'mission' && (
              <>
                <div className="form-grid">
                  <div className="form-section">
                    <label className="form-label">
                      <Clock className="form-label-icon" />
                      Heure de sortie *
                    </label>
                    <input
                      type="time"
                      value={formData.heure_depart}
                      onChange={(e) => handleInputChange('heure_depart', e.target.value)}
                      className={`form-input ${errors.heure_depart ? 'error' : ''}`}
                    />
                    {errors.heure_depart && <div className="error-message"><AlertCircle size={16} /> {errors.heure_depart}</div>}
                  </div>
                  <div className="form-section">
                    <label className="form-label">
                      <Clock className="form-label-icon" />
                      Heure de retour *
                    </label>
                    <input
                      type="time"
                      value={formData.heure_retour}
                      onChange={(e) => handleInputChange('heure_retour', e.target.value)}
                      className={`form-input ${errors.heure_retour ? 'error' : ''}`}
                    />
                    {errors.heure_retour && <div className="error-message"><AlertCircle size={16} /> {errors.heure_retour}</div>}
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">
                    Frais de déplacement (TND)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.frais_deplacement}
                    onChange={(e) => handleInputChange('frais_deplacement', e.target.value)}
                    placeholder="0.00"
                    className="form-input"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <div className="loading-spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : (
                <>
                  <Send size={20} />
                  <span>Soumettre la demande</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
