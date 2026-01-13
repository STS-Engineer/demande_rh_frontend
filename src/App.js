import React, { useState, useEffect } from 'react';
import logo from './logo_sts.png';
import logoo from './logo_sts2.png';
import { 
  Calendar, Clock, User, FileText, Send, CheckCircle, 
  AlertCircle, FileCheck, Briefcase, File, Search
} from 'lucide-react';
import './DemandeRHForm.css';

// URL de l'API - utilise la variable d'environnement en production, localhost en développement
const API_BASE_URL = 'https://hr-back.azurewebsites.net';

// Composant réutilisable pour la recherche d'employés
const EmployeeSearchInput = ({
  searchTerm,
  setSearchTerm,
  filteredEmployees,
  showDropdown,
  setShowDropdown,
  selectedEmployee,
  setSelectedEmployee,
  errors,
  fieldName,
  placeholder = "Rechercher un employé...",
  onEmployeeSelect
}) => {
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee({
      id: employee.id,
      name: `${employee.nom} ${employee.prenom}`,
      nom: employee.nom,
      prenom: employee.prenom
    });
    setSearchTerm(`${employee.nom} ${employee.prenom} - ${employee.poste}`);
    setShowDropdown(false);
    
    if (onEmployeeSelect) {
      onEmployeeSelect(employee.id);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si l'utilisateur efface le champ, réinitialiser la sélection
    if (value.trim() === '') {
      setSelectedEmployee({ id: '', name: '', nom: '', prenom: '' });
      if (onEmployeeSelect) {
        onEmployeeSelect('');
      }
    }
    
    if (value.trim() === '') {
      setShowDropdown(false);
    } else {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleFocus = () => {
    if (searchTerm.trim() !== '' && filteredEmployees.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="employee-search-container">
      <label className="form-label">
        <User className="form-label-icon" />
        Employé *
      </label>
      <div className="search-input-wrapper">
        <div className="search-input-group">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`form-input ${errors[fieldName] ? 'error' : ''}`}
          />
        </div>
        {errors[fieldName] && (
          <div className="error-message">
            <AlertCircle size={16} /> {errors[fieldName]}
          </div>
        )}
        
        {showDropdown && filteredEmployees.length > 0 && (
          <div className="employee-dropdown">
            {filteredEmployees.map(emp => (
              <div
                key={emp.id}
                className="dropdown-item"
                onClick={() => handleEmployeeSelect(emp)}
              >
                <div className="employee-name">
                  {emp.nom} {emp.prenom}
                </div>
                <div className="employee-poste">
                  {emp.poste}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showDropdown && filteredEmployees.length === 0 && searchTerm.trim() !== '' && (
          <div className="employee-dropdown">
            <div className="dropdown-item no-results">
              <AlertCircle size={16} style={{ marginRight: '8px' }} />
              Aucun employé trouvé
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function DemandeRHForm() {
  const [activeSection, setActiveSection] = useState('demandes'); // 'demandes' ou 'documents'
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  // États pour la recherche d'employés (section demandes)
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState({ 
    id: '', 
    name: '', 
    nom: '', 
    prenom: '' 
  });

  // États pour la recherche d'employés (section documents)
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentFilteredEmployees, setDocumentFilteredEmployees] = useState([]);
  const [documentShowDropdown, setDocumentShowDropdown] = useState(false);
  const [documentSelectedEmployee, setDocumentSelectedEmployee] = useState({ 
    id: '', 
    name: '', 
    nom: '', 
    prenom: '' 
  });

  // États pour la section demandes
  const [demandeFormData, setDemandeFormData] = useState({
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

  // États pour la section documents
  const [documentFormData, setDocumentFormData] = useState({
    employe_id: '',
    type_document: 'attestation_travail'
  });

  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentSubmitted, setDocumentSubmitted] = useState(false);

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

  // Filtrage des employés pour la section demandes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees([]);
    } else {
      const filtered = employees.filter(emp => {
        const fullName = `${emp.nom} ${emp.prenom}`.toLowerCase();
        const fullNameWithPoste = `${emp.nom} ${emp.prenom} - ${emp.poste}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               fullNameWithPoste.includes(search) ||
               emp.nom.toLowerCase().includes(search) || 
               emp.prenom.toLowerCase().includes(search) ||
               emp.poste.toLowerCase().includes(search);
      });
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // Filtrage des employés pour la section documents
  useEffect(() => {
    if (documentSearchTerm.trim() === '') {
      setDocumentFilteredEmployees([]);
    } else {
      const filtered = employees.filter(emp => {
        const fullName = `${emp.nom} ${emp.prenom}`.toLowerCase();
        const fullNameWithPoste = `${emp.nom} ${emp.prenom} - ${emp.poste}`.toLowerCase();
        const search = documentSearchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               fullNameWithPoste.includes(search) ||
               emp.nom.toLowerCase().includes(search) || 
               emp.prenom.toLowerCase().includes(search) ||
               emp.poste.toLowerCase().includes(search);
      });
      setDocumentFilteredEmployees(filtered);
    }
  }, [documentSearchTerm, employees]);

  // ============================================
  // FONCTIONS POUR LA SECTION DEMANDES
  // ============================================

  const handleEmployeeSelect = (employeeId) => {
    setDemandeFormData(prev => ({
      ...prev,
      employe_id: employeeId
    }));
    
    // Effacer l'erreur du champ employé si elle existe
    if (errors.employe_id) {
      setErrors(prev => ({
        ...prev,
        employe_id: ''
      }));
    }
  };

  const validateDemandeForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires
    if (!demandeFormData.employe_id) newErrors.employe_id = 'Veuillez sélectionner un employé';
    if (!demandeFormData.type_demande) newErrors.type_demande = 'Veuillez sélectionner un type de demande';
    if (!demandeFormData.titre.trim()) newErrors.titre = 'Veuillez saisir le motif de la demande';
    if (!demandeFormData.date_depart) newErrors.date_depart = 'Veuillez saisir la date de départ';

    // Validation conditionnelle selon le type de demande
    if (demandeFormData.type_demande === 'conges' || demandeFormData.type_demande === 'mission') {
      if (!demandeFormData.date_retour) newErrors.date_retour = 'Veuillez saisir la date de retour';
      
      // Validation des dates
      if (demandeFormData.date_depart && demandeFormData.date_retour) {
        const dateDepart = new Date(demandeFormData.date_depart);
        const dateRetour = new Date(demandeFormData.date_retour);
        if (dateRetour < dateDepart) {
          newErrors.date_retour = 'La date de retour doit être après la date de départ';
        }
      }
    }

    if (demandeFormData.type_demande === 'conges' && !demandeFormData.type_conge) {
      newErrors.type_conge = 'Veuillez sélectionner un type de congé';
    }

    // Si "Autre" est choisi, le champ texte est obligatoire
    if (demandeFormData.type_demande === 'conges' && demandeFormData.type_conge === 'autre') {
      if (!demandeFormData.type_conge_autre || !demandeFormData.type_conge_autre.trim()) {
        newErrors.type_conge_autre = 'Veuillez préciser le type de congé';
      }
    }

    if (demandeFormData.type_demande === 'autorisation') {
      if (!demandeFormData.heure_depart) newErrors.heure_depart = 'Veuillez saisir l\'heure de départ';
      if (!demandeFormData.heure_retour) newErrors.heure_retour = 'Veuillez saisir l\'heure d\'arrivée';
      
      // Validation des heures
      if (demandeFormData.heure_depart && demandeFormData.heure_retour) {
        if (demandeFormData.heure_retour <= demandeFormData.heure_depart) {
          newErrors.heure_retour = 'L\'heure d\'arrivée doit être après l\'heure de départ';
        }
      }
    }

    if (demandeFormData.type_demande === 'mission') {
      if (!demandeFormData.heure_depart) newErrors.heure_depart = 'Veuillez saisir l\'heure de sortie';
      if (!demandeFormData.heure_retour) newErrors.heure_retour = 'Veuillez saisir l\'heure de retour';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDemandeSubmit = async () => {
    // Validation de l'employé sélectionné
    if (!selectedEmployee.id) {
      setErrors(prev => ({
        ...prev,
        employe_id: 'Veuillez sélectionner un employé'
      }));
      return;
    }

    if (!validateDemandeForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour l'envoi
      const dataToSend = {
        ...demandeFormData,
        employe_id: selectedEmployee.id,
        // Convertir les chaînes vides en null pour les champs optionnels
        date_retour: demandeFormData.date_retour || null,
        heure_depart: demandeFormData.heure_depart || null,
        heure_retour: demandeFormData.heure_retour || null,
        frais_deplacement: demandeFormData.frais_deplacement ? parseFloat(demandeFormData.frais_deplacement) : null,
        type_conge: demandeFormData.type_conge || null,
        type_conge_autre:
          demandeFormData.type_conge === 'autre' && demandeFormData.type_conge_autre
            ? demandeFormData.type_conge_autre.trim()
            : null,
        demi_journee: demandeFormData.demi_journee || false
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
          setDemandeFormData({
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
          // Réinitialiser la recherche
          setSearchTerm('');
          setSelectedEmployee({ id: '', name: '', nom: '', prenom: '' });
          setFilteredEmployees([]);
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

  const handleDemandeInputChange = (field, value) => {
    setDemandeFormData(prev => ({
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
    setDemandeFormData(prev => ({
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

  // ============================================
  // FONCTIONS POUR LA SECTION DOCUMENTS
  // ============================================

  const handleDocumentEmployeeSelect = (employeeId) => {
    setDocumentFormData(prev => ({
      ...prev,
      employe_id: employeeId
    }));
  };

  const handleDocumentSubmit = async () => {
    // Validation simple
    if (!documentSelectedEmployee.id) {
      alert('Veuillez sélectionner votre nom');
      return;
    }

    setDocumentLoading(true);

    try {
      const dataToSend = {
        ...documentFormData,
        employe_id: documentSelectedEmployee.id
      };

      const response = await fetch(`${API_BASE_URL}/api/generer-attestation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        setDocumentSubmitted(true);
        setTimeout(() => {
          setDocumentSubmitted(false);
          // Réinitialiser le formulaire
          setDocumentFormData({
            employe_id: '',
            type_document: 'attestation_travail'
          });
          // Réinitialiser la recherche
          setDocumentSearchTerm('');
          setDocumentSelectedEmployee({ id: '', name: '', nom: '', prenom: '' });
          setDocumentFilteredEmployees([]);
        }, 4000);
      } else {
        alert(result.error || 'Erreur lors de la génération du document');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleDocumentInputChange = (field, value) => {
    setDocumentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ============================================
  // RENDU CONDITIONNEL
  // ============================================

  if (activeSection === 'demandes' && submitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle className="success-icon" />
          <h2 className="success-title">Demande envoyée !</h2>
          <p className="success-message">
            Votre demande a été transmise à votre responsable hiérarchique.
            <br />Vous recevrez une notification par email.
          </p>
          <button 
            onClick={() => setActiveSection('documents')}
            className="section-switch-button"
          >
            <File size={18} />
            Demander un document
          </button>
        </div>
      </div>
    );
  }

  if (activeSection === 'documents' && documentSubmitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <FileCheck className="success-icon" />
          <h2 className="success-title">Document envoyé !</h2>
          <p className="success-message">
            Votre Document a été générée et envoyée par email.
            <br />Il sera traitée par l'administration.
          </p>
          <button 
            onClick={() => setActiveSection('demandes')}
            className="section-switch-button"
          >
            <Briefcase size={18} />
            Faire une demande RH
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="demande-container">
      <div className="demande-form-wrapper">
        {/* En-tête avec boutons de navigation */}
        <div className="navigation-header">
          <button 
            className={`nav-button ${activeSection === 'demandes' ? 'active' : ''}`}
            onClick={() => setActiveSection('demandes')}
          >
            <Briefcase size={20} />
            Demandes 
          </button>
          <button 
            className={`nav-button ${activeSection === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveSection('documents')}
          >
            <File size={20} />
            Documents
          </button>
        </div>

        {activeSection === 'demandes' ? (
          <div className="demande-card">
            <div className="demande-header">
             <img src={logoo} alt="Logo" className="header-logo" />
            </div>

            <div className="demande-body">
              {/* Type de Demande */}
              <div className="form-section">
                <label className="form-label">
                  <FileText className="form-label-icon" />
                  Type de Demande *
                </label>
                <select
                  value={demandeFormData.type_demande}
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

              {/* Employé - Recherche */}
              <div className="form-section">
                <EmployeeSearchInput
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filteredEmployees={filteredEmployees}
                  showDropdown={showDropdown}
                  setShowDropdown={setShowDropdown}
                  selectedEmployee={selectedEmployee}
                  setSelectedEmployee={setSelectedEmployee}
                  errors={errors}
                  fieldName="employe_id"
                  placeholder="Rechercher votre nom..."
                  onEmployeeSelect={handleEmployeeSelect}
                />
              </div>

              {/* Motif */}
              <div className="form-section">
                <label className="form-label">
                  Motif de la demande *
                </label>
                <textarea
                  value={demandeFormData.titre}
                  onChange={(e) => handleDemandeInputChange('titre', e.target.value)}
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
                    value={demandeFormData.date_depart}
                    onChange={(e) => handleDemandeInputChange('date_depart', e.target.value)}
                    className={`form-input ${errors.date_depart ? 'error' : ''}`}
                  />
                  {errors.date_depart && <div className="error-message"><AlertCircle size={16} /> {errors.date_depart}</div>}
                </div>

                {(demandeFormData.type_demande === 'conges' || demandeFormData.type_demande === 'mission') && (
                  <div className="form-section">
                    <label className="form-label">
                      <Calendar className="form-label-icon" />
                      Date de retour *
                    </label>
                    <input
                      type="date"
                      value={demandeFormData.date_retour}
                      onChange={(e) => handleDemandeInputChange('date_retour', e.target.value)}
                      className={`form-input ${errors.date_retour ? 'error' : ''}`}
                    />
                    {errors.date_retour && <div className="error-message"><AlertCircle size={16} /> {errors.date_retour}</div>}
                  </div>
                )}
              </div>

              {demandeFormData.type_demande === 'conges' && (
                <>
                  <div className="form-checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={demandeFormData.demi_journee}
                        onChange={(e) => handleDemandeInputChange('demi_journee', e.target.checked)}
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
                          checked={demandeFormData.type_conge === 'annuel'}
                          onChange={(e) => handleDemandeInputChange('type_conge', e.target.value)}
                          className="radio-input"
                        />
                        Congé annuel
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="type_conge"
                          value="sans_solde"
                          checked={demandeFormData.type_conge === 'sans_solde'}
                          onChange={(e) => handleDemandeInputChange('type_conge', e.target.value)}
                          className="radio-input"
                        />
                        Congé sans solde
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="type_conge"
                          value="autre"
                          checked={demandeFormData.type_conge === 'autre'}
                          onChange={(e) => handleDemandeInputChange('type_conge', e.target.value)}
                          className="radio-input"
                        />
                        Autre (à préciser)
                      </label>
                    </div>

                    {demandeFormData.type_conge === 'autre' && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          type="text"
                          value={demandeFormData.type_conge_autre}
                          onChange={(e) => handleDemandeInputChange('type_conge_autre', e.target.value)}
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

              {demandeFormData.type_demande === 'autorisation' && (
                <div className="form-grid">
                  <div className="form-section">
                    <label className="form-label">
                      <Clock className="form-label-icon" />
                      Heure de départ *
                    </label>
                    <input
                      type="time"
                      value={demandeFormData.heure_depart}
                      onChange={(e) => handleDemandeInputChange('heure_depart', e.target.value)}
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
                      value={demandeFormData.heure_retour}
                      onChange={(e) => handleDemandeInputChange('heure_retour', e.target.value)}
                      className={`form-input ${errors.heure_retour ? 'error' : ''}`}
                    />
                    {errors.heure_retour && <div className="error-message"><AlertCircle size={16} /> {errors.heure_retour}</div>}
                  </div>
                </div>
              )}

              {demandeFormData.type_demande === 'mission' && (
                <>
                  <div className="form-grid">
                    <div className="form-section">
                      <label className="form-label">
                        <Clock className="form-label-icon" />
                        Heure de sortie *
                      </label>
                      <input
                        type="time"
                        value={demandeFormData.heure_depart}
                        onChange={(e) => handleDemandeInputChange('heure_depart', e.target.value)}
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
                        value={demandeFormData.heure_retour}
                        onChange={(e) => handleDemandeInputChange('heure_retour', e.target.value)}
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
                      value={demandeFormData.frais_deplacement}
                      onChange={(e) => handleDemandeInputChange('frais_deplacement', e.target.value)}
                      placeholder="0.00"
                      className="form-input"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleDemandeSubmit}
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
        ) : (
          <div className="demande-card">
            <div className="demande-header">
              <img src={logoo} alt="Logo" className="header-logo" />
            </div>

            <div className="demande-body">
              {/* Employé - Recherche */}
              <div className="form-section">
                <EmployeeSearchInput
                  searchTerm={documentSearchTerm}
                  setSearchTerm={setDocumentSearchTerm}
                  filteredEmployees={documentFilteredEmployees}
                  showDropdown={documentShowDropdown}
                  setShowDropdown={setDocumentShowDropdown}
                  selectedEmployee={documentSelectedEmployee}
                  setSelectedEmployee={setDocumentSelectedEmployee}
                  errors={{}}
                  fieldName="employe_id"
                  placeholder="Rechercher votre nom..."
                  onEmployeeSelect={handleDocumentEmployeeSelect}
                />
              </div>

              <div className="form-section">
                <label className="form-label">
                  <FileCheck className="form-label-icon" />
                  Type de Document *
                </label>
                <select
                  value={documentFormData.type_document}
                  onChange={(e) => handleDocumentInputChange('type_document', e.target.value)}
                  className="form-select"
                >
                  <option value="attestation_travail">Attestation de Travail</option>
                  <option value="attestation_salaire">Attestation de Salaire</option>
                </select>
              </div>

              <div className="info-box">
                <div className="info-icon">
                  <FileCheck size={24} />
                </div>
                <div className="info-content">
                  <h4>Information importante</h4>
                  <p>
                    Le document sera généré automatiquement à partir de vos informations
                    personnelles et envoyé directement par e-mail au responsable RH.
                    Vous pourrez le récupérer auprès de son bureau dans un délai de 24 heures.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDocumentSubmit}
                disabled={documentLoading}
                className="submit-button"
              >
                {documentLoading ? (
                  <div className="loading-spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  <>
                    <FileCheck size={20} />
                    <span>Générer et envoyer l'attestation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
