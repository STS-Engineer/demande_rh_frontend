import React, { useState, useEffect } from 'react';
import logo from './logo_sts.png';
import logoo from './logo_sts2.png';
import { 
  Calendar, Clock, User, FileText, Send, CheckCircle, 
  AlertCircle, FileCheck, Briefcase, File, Search, PenLine,
  TrendingUp, DollarSign
} from 'lucide-react';
import './DemandeRHForm.css';

// URL de l'API - utilise la variable d'environnement en production, localhost en développement
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5001'
  : 'https://hr-back.azurewebsites.net';
const getTenantFromPath = () => {
  const path = window.location.pathname.toLowerCase();
  const firstSegment = path.split('/').filter(Boolean)[0] || '';
  const tenantAliases = {
    tunisia: 'tunisia',
    tunisie: 'tunisia',
    tn: 'tunisia',
    china: 'china',
    cn: 'china',
    germany: 'germany',
    deutschland: 'germany',
    de: 'germany',
    france: 'france',
    fr: 'france',
    india: 'india',
    in: 'india',
    korea: 'korea',
    kr: 'korea',
    'south-korea': 'korea',
    luxembourg: 'luxembourg',
    lu: 'luxembourg',
    mexico: 'mexico',
    mx: 'mexico'
  };

  if (tenantAliases[firstSegment]) {
    return tenantAliases[firstSegment];
  }

  return 'tunisia';
};
const TENANT = getTenantFromPath();
const apiFetch = (endpoint, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    'X-Tenant': TENANT
  };

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
};

// ============================================
// CHANGE 1: Added countWorkingDays helper function
// ============================================
const countWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  if (end <= start) return '';

  let count = 0;
  const current = new Date(start);

  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count.toString();
};

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
    frais_deplacement: '',
    nombre_jours: ''
  });

  // États pour la section documents
  const [documentFormData, setDocumentFormData] = useState({
    employe_id: '',
    type_document: 'attestation_travail'
  });



















  // Etats pour la demande d'avance sur salaire
  const [avanceFormData, setAvanceFormData] = useState({
    montant_demande: '',
    mode_remboursement: '',
    signature_demandeur: '',
    acceptation_responsabilite: false
  });

  // ============================================
  // NEW: États pour la demande de révision sur salaire
  // ============================================
  const [revisionFormData, setRevisionFormData] = useState({
    salaire_actuel: '',
    salaire_souhaite: '',
    justification: '',
    date_souhaitee: '',
    documents_justificatifs: '',
    acceptation_confirmation: false
  });

  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentSubmitted, setDocumentSubmitted] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await apiFetch('/api/employees/actifs');
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
      if (!demandeFormData.date_retour) {
        newErrors.date_retour = 'Veuillez saisir la date de retour';
      }

      if (demandeFormData.date_depart && demandeFormData.date_retour) {
        const dateDepart = new Date(demandeFormData.date_depart);
        const dateRetour = new Date(demandeFormData.date_retour);

        // Cas mission : même jour autorisé
        if (demandeFormData.type_demande === 'mission') {
          if (dateRetour < dateDepart) {
            newErrors.date_retour = 'La date de retour ne peut pas être avant la date de départ';
          }
        }

        // Cas congé
        if (demandeFormData.type_demande === 'conges') {
          const isDemiJournee = demandeFormData.type_conge === 'demi_journee';

          if (isDemiJournee) {
            // Demi-journée : même date autorisée
            if (dateRetour < dateDepart) {
              newErrors.date_retour = 'La date de retour ne peut pas être avant la date de départ';
            }
          } else {
            // Congé normal : retour = 1er jour de reprise, donc strictement après
            if (dateRetour <= dateDepart) {
              newErrors.date_retour = 'La date de retour est le 1er jour de reprise du travail — elle doit être après la date de départ';
            }
          }
        }
      }
    }

    if (demandeFormData.type_demande === 'conges' && !demandeFormData.type_conge) {
      newErrors.type_conge = 'Veuillez sélectionner un type de congé';
    }

    if (demandeFormData.type_demande === 'conges') {
      if (!demandeFormData.nombre_jours || demandeFormData.nombre_jours === '') {
        newErrors.nombre_jours = 'Veuillez saisir le nombre de jours ouvrables';
      } else if (parseFloat(demandeFormData.nombre_jours) < 0.5) {
        newErrors.nombre_jours = 'Le nombre de jours doit être au moins 0.5';
      }
    }

    if (demandeFormData.type_demande === 'autorisation') {
      if (!demandeFormData.heure_depart) newErrors.heure_depart = 'Veuillez saisir l\'heure de départ';
      if (!demandeFormData.heure_retour) newErrors.heure_retour = 'Veuillez saisir l\'heure d\'arrivée';

      // Validation des heures
      if (demandeFormData.heure_depart && demandeFormData.heure_retour) {
        if (demandeFormData.heure_retour <= demandeFormData.heure_depart) {
          newErrors.heure_retour = 'L\'heure d\'arrivée doit être après l\'heure de départ';
        } else {
          // Autorisation ne peut pas dépasser 4 heures
          const [depH, depM] = demandeFormData.heure_depart.split(':').map(Number);
          const [retH, retM] = demandeFormData.heure_retour.split(':').map(Number);
          const durationMinutes = (retH * 60 + retM) - (depH * 60 + depM);
          if (durationMinutes > 180) {
            newErrors.heure_retour = 'Une autorisation ne peut pas dépasser 3 heures';
          }
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

  // ============================================
  // NEW: Validation pour révision sur salaire
  // ============================================
  const validateRevisionForm = () => {
    const newErrors = {};

    if (!selectedEmployee.id) newErrors.employe_id = 'Veuillez sélectionner un employé';
    if (!demandeFormData.titre.trim()) newErrors.titre = 'Veuillez saisir le titre/motif de la demande';
    if (!revisionFormData.salaire_actuel) {
      newErrors.salaire_actuel = 'Veuillez indiquer votre salaire actuel';
    } else if (parseFloat(revisionFormData.salaire_actuel) <= 0) {
      newErrors.salaire_actuel = 'Le salaire doit être supérieur à 0';
    }
    if (!revisionFormData.salaire_souhaite) {
      newErrors.salaire_souhaite = 'Veuillez indiquer le salaire souhaité';
    } else if (parseFloat(revisionFormData.salaire_souhaite) <= parseFloat(revisionFormData.salaire_actuel)) {
      newErrors.salaire_souhaite = 'Le salaire souhaité doit être supérieur au salaire actuel';
    }
    if (!revisionFormData.justification.trim()) {
      newErrors.justification = 'Veuillez fournir une justification détaillée';
    }
    if (!revisionFormData.date_souhaitee) {
      newErrors.date_souhaitee = 'Veuillez indiquer la date souhaitée pour la révision';
    }
    if (!revisionFormData.acceptation_confirmation) {
      newErrors.acceptation_confirmation = 'Veuillez confirmer votre demande';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // NEW: Submit pour révision sur salaire
  // ============================================
  const handleRevisionSubmit = async () => {
    if (!validateRevisionForm()) return;

    setLoading(true);

    try {
      const response = await apiFetch('/api/demandes-revision-salaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id: selectedEmployee.id,
          titre_motif: demandeFormData.titre,
          salaire_actuel: parseFloat(revisionFormData.salaire_actuel),
          salaire_souhaite: parseFloat(revisionFormData.salaire_souhaite),
          justification: revisionFormData.justification,
          date_souhaitee: revisionFormData.date_souhaitee,
          documents_justificatifs: revisionFormData.documents_justificatifs || null,
          date_demande: new Date().toISOString().split('T')[0]
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
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
            frais_deplacement: '',
            nombre_jours: ''
          });
          setRevisionFormData({
            salaire_actuel: '',
            salaire_souhaite: '',
            justification: '',
            date_souhaitee: '',
            documents_justificatifs: '',
            acceptation_confirmation: false
          });
          setSearchTerm('');
          setSelectedEmployee({ id: '', name: '', nom: '', prenom: '' });
          setFilteredEmployees([]);
        }, 4000);
      } else {
        alert(result.error || 'Erreur lors de la soumission de la demande de révision');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDemandeSubmit = async () => {
    // NEW: Check if it's revision request
    if (demandeFormData.type_demande === 'revision_salaire') {
      await handleRevisionSubmit();
      return;
    }

    if (demandeFormData.type_demande === 'avance_salaire') {
      await handleAvanceSubmit();
      return;
    }

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
      // "demi_journee" est une valeur UI uniquement — on reconvertit pour le backend
      const isDemiJournee = demandeFormData.type_conge === 'demi_journee';
      const dataToSend = {
        ...demandeFormData,
        employe_id: selectedEmployee.id,
        // Convertir les chaînes vides en null pour les champs optionnels
        date_retour: demandeFormData.date_retour || null,
        heure_depart: demandeFormData.heure_depart || null,
        heure_retour: demandeFormData.heure_retour || null,
        frais_deplacement: demandeFormData.frais_deplacement ? parseFloat(demandeFormData.frais_deplacement) : null,
        // Le backend attend 'annuel' ou 'sans_solde' — jamais 'demi_journee'
        type_conge: isDemiJournee ? 'annuel' : (demandeFormData.type_conge || null),
        type_conge_autre: null,
        demi_journee: isDemiJournee ? true : (demandeFormData.demi_journee || false)
      };

      const response = await apiFetch('/api/demandes', {
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
            frais_deplacement: '',
            nombre_jours: ''
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

  // ============================================
  // CHANGE 2: Updated handleDemandeInputChange to auto-calculate nombre_jours
  // ============================================
  const handleDemandeInputChange = (field, value) => {
    setDemandeFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate nombre_jours when dates change for annuel/sans_solde
      if (
        (field === 'date_depart' || field === 'date_retour') &&
        (updated.type_conge === 'annuel' || updated.type_conge === 'sans_solde')
      ) {
        updated.nombre_jours = countWorkingDays(updated.date_depart, updated.date_retour);
      }

      return updated;
    });

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
      frais_deplacement: '',
      nombre_jours: ''
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
  // FONCTIONS POUR LA DEMANDE D'AVANCE SUR SALAIRE
  // ============================================

  const handleAvanceInputChange = (field, value) => {
    setAvanceFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateAvanceForm = () => {
    const newErrors = {};

    if (!selectedEmployee.id) newErrors.employe_id = 'Veuillez sélectionner un employé';
    if (!demandeFormData.titre.trim()) newErrors.titre = 'Veuillez saisir le titre / motif de l\'avance';
    if (!avanceFormData.montant_demande) {
      newErrors.montant_demande = 'Veuillez saisir le montant demandé';
    } else if (parseFloat(avanceFormData.montant_demande) <= 0) {
      newErrors.montant_demande = 'Le montant doit être supérieur à 0';
    }
    if (!avanceFormData.mode_remboursement.trim()) {
      newErrors.mode_remboursement = 'Veuillez saisir le mode de remboursement souhaité';
    }
    if (!avanceFormData.signature_demandeur.trim()) {
      newErrors.signature_demandeur = 'Veuillez signer la demande avec votre nom complet';
    }
    if (!avanceFormData.acceptation_responsabilite) {
      newErrors.acceptation_responsabilite = 'Veuillez accepter la prise de responsabilité';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvanceSubmit = async () => {
    if (!validateAvanceForm()) return;

    setLoading(true);

    try {
      const response = await apiFetch('/api/demandes-avance-salaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id: selectedEmployee.id,
          titre_motif: demandeFormData.titre,
          montant_demande: parseFloat(avanceFormData.montant_demande),
          mode_remboursement_souhaite: avanceFormData.mode_remboursement,
          signature_demandeur: avanceFormData.signature_demandeur,
          acceptation_responsabilite: avanceFormData.acceptation_responsabilite
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
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
            frais_deplacement: '',
            nombre_jours: ''
          });
          setAvanceFormData({
            montant_demande: '',
            mode_remboursement: '',
            signature_demandeur: '',
            acceptation_responsabilite: false
          });
          setSearchTerm('');
          setSelectedEmployee({ id: '', name: '', nom: '', prenom: '' });
          setFilteredEmployees([]);
        }, 4000);
      } else {
        alert(result.error || 'Erreur lors de la soumission de la demande d\'avance');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // NEW: Handler for revision form inputs
  // ============================================
  const handleRevisionInputChange = (field, value) => {
    setRevisionFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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

      const response = await apiFetch('/api/generer-attestation', {
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
                  <option value="avance_salaire">Avance sur salaire</option>
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

              {/* Dates - Hidden for avance_salaire and revision_salaire */}
              {demandeFormData.type_demande !== 'avance_salaire' && demandeFormData.type_demande !== 'revision_salaire' && (
              <>
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
                      Date de reprise de travail *
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
              </>
              )}

              {/* AVANCE SUR SALAIRE SECTION - Existing */}
              {demandeFormData.type_demande === 'avance_salaire' && (
                <>
                  <div className="form-section">
                    <label className="form-label">Montant demandé (TND) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={avanceFormData.montant_demande}
                      onChange={(e) => handleAvanceInputChange('montant_demande', e.target.value)}
                      placeholder="Ex: 500.000"
                      className={`form-input ${errors.montant_demande ? 'error' : ''}`}
                    />
                    {errors.montant_demande && <div className="error-message"><AlertCircle size={16} /> {errors.montant_demande}</div>}
                  </div>

                  <div className="form-section">
                    <label className="form-label">Mode de remboursement souhaité *</label>
                    <textarea
                      value={avanceFormData.mode_remboursement}
                      onChange={(e) => handleAvanceInputChange('mode_remboursement', e.target.value)}
                      rows="3"
                      placeholder="Ex: remboursement sur 2 mois / retenue mensuelle de ... TND"
                      className={`form-textarea ${errors.mode_remboursement ? 'error' : ''}`}
                    />
                    {errors.mode_remboursement && <div className="error-message"><AlertCircle size={16} /> {errors.mode_remboursement}</div>}
                  </div>

                  <div className="info-box">
                    <div className="info-icon"><PenLine size={24} /></div>
                    <div className="info-content">
                      <h4>Signature et responsabilité</h4>
                      <p>La signature ci-dessous confirme votre acceptation du montant demandé et votre responsabilité concernant le remboursement.</p>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Signature demandeur *</label>
                    <input
                      type="text"
                      value={avanceFormData.signature_demandeur}
                      onChange={(e) => handleAvanceInputChange('signature_demandeur', e.target.value)}
                      placeholder="Saisissez votre nom complet comme signature"
                      className={`form-input ${errors.signature_demandeur ? 'error' : ''}`}
                    />
                    {errors.signature_demandeur && <div className="error-message"><AlertCircle size={16} /> {errors.signature_demandeur}</div>}
                  </div>

                  <div className="form-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={avanceFormData.acceptation_responsabilite}
                        onChange={(e) => handleAvanceInputChange('acceptation_responsabilite', e.target.checked)}
                      />
                      J'accepte la prise de responsabilité et les modalités de remboursement indiquées.
                    </label>
                    {errors.acceptation_responsabilite && <div className="error-message"><AlertCircle size={16} /> {errors.acceptation_responsabilite}</div>}
                  </div>
                </>
              )}

              {/* ============================================ */}
              {/* NEW: RÉVISION SUR SALAIRE SECTION */}
              {/* ============================================ */}
              {demandeFormData.type_demande === 'revision_salaire' && (
                <>
                  <div className="info-box revision-info">
                    <div className="info-icon"><TrendingUp size={24} /></div>
                    <div className="info-content">
                      <h4>Demande de révision salariale</h4>
                      <p>Veuillez remplir tous les champs ci-dessous pour soumettre votre demande de révision de salaire. Cette demande sera étudiée par votre responsable hiérarchique et les RH.</p>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <DollarSign className="form-label-icon" />
                      Salaire actuel (TND) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={revisionFormData.salaire_actuel}
                      onChange={(e) => handleRevisionInputChange('salaire_actuel', e.target.value)}
                      placeholder="Ex: 1500.000"
                      className={`form-input ${errors.salaire_actuel ? 'error' : ''}`}
                    />
                    {errors.salaire_actuel && <div className="error-message"><AlertCircle size={16} /> {errors.salaire_actuel}</div>}
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <TrendingUp className="form-label-icon" />
                      Salaire souhaité (TND) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={revisionFormData.salaire_souhaite}
                      onChange={(e) => handleRevisionInputChange('salaire_souhaite', e.target.value)}
                      placeholder="Ex: 1800.000"
                      className={`form-input ${errors.salaire_souhaite ? 'error' : ''}`}
                    />
                    {errors.salaire_souhaite && <div className="error-message"><AlertCircle size={16} /> {errors.salaire_souhaite}</div>}
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <FileText className="form-label-icon" />
                      Justification détaillée *
                    </label>
                    <textarea
                      value={revisionFormData.justification}
                      onChange={(e) => handleRevisionInputChange('justification', e.target.value)}
                      rows="4"
                      placeholder="Décrivez en détail les raisons de votre demande (ancienneté, performances, responsabilités additionnelles, formation, etc.)"
                      className={`form-textarea ${errors.justification ? 'error' : ''}`}
                    />
                    {errors.justification && <div className="error-message"><AlertCircle size={16} /> {errors.justification}</div>}
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <Calendar className="form-label-icon" />
                      Date souhaitée pour la révision *
                    </label>
                    <input
                      type="date"
                      value={revisionFormData.date_souhaitee}
                      onChange={(e) => handleRevisionInputChange('date_souhaitee', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`form-input ${errors.date_souhaitee ? 'error' : ''}`}
                    />
                    {errors.date_souhaitee && <div className="error-message"><AlertCircle size={16} /> {errors.date_souhaitee}</div>}
                  </div>

                  <div className="form-section">
                    <label className="form-label">
                      <File className="form-label-icon" />
                      Documents justificatifs (optionnel)
                    </label>
                    <textarea
                      value={revisionFormData.documents_justificatifs}
                      onChange={(e) => handleRevisionInputChange('documents_justificatifs', e.target.value)}
                      rows="2"
                      placeholder="Listez les documents que vous allez fournir (ex: certificats de formation, évaluations de performances, etc.)"
                      className="form-textarea"
                    />
                    <small className="form-help">Vous pourrez joindre ces documents par email après soumission de la demande.</small>
                  </div>

                  <div className="info-box revision-highlight">
                    <div className="info-icon"><CheckCircle size={24} /></div>
                    <div className="info-content">
                      <h4>Engagement du demandeur</h4>
                      <p>En confirmant cette demande, je certifie que les informations fournies sont exactes et que ma demande de révision salariale est basée sur des éléments objectifs. Je comprends que cette demande sera étudiée dans le respect des procédures internes.</p>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={revisionFormData.acceptation_confirmation}
                        onChange={(e) => handleRevisionInputChange('acceptation_confirmation', e.target.checked)}
                      />
                      Je confirme ma demande de révision sur salaire et j'accepte le traitement de ma demande selon la politique RH de l'entreprise.
                    </label>
                    {errors.acceptation_confirmation && <div className="error-message"><AlertCircle size={16} /> {errors.acceptation_confirmation}</div>}
                  </div>
                </>
              )}

              {demandeFormData.type_demande === 'conges' && (
                <div className="form-section">
                  <label className="form-label">
                    Type de congé *
                  </label>
                  <div className="radio-group">
                    {/* CHANGE 3: Updated annuel radio onChange to recalculate working days */}
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="annuel"
                        checked={demandeFormData.type_conge === 'annuel'}
                        onChange={(e) => {
                          handleDemandeInputChange('type_conge', e.target.value);
                          handleDemandeInputChange('demi_journee', false);
                          handleDemandeInputChange('nombre_jours',
                            countWorkingDays(demandeFormData.date_depart, demandeFormData.date_retour)
                          );
                        }}
                        className="radio-input"
                      />
                      Congé annuel
                    </label>
                    {/* CHANGE 3: Updated sans_solde radio onChange to recalculate working days */}
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="sans_solde"
                        checked={demandeFormData.type_conge === 'sans_solde'}
                        onChange={(e) => {
                          handleDemandeInputChange('type_conge', e.target.value);
                          handleDemandeInputChange('demi_journee', false);
                          handleDemandeInputChange('nombre_jours',
                            countWorkingDays(demandeFormData.date_depart, demandeFormData.date_retour)
                          );
                        }}
                        className="radio-input"
                      />
                      Congé sans solde
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type_conge"
                        value="demi_journee"
                        checked={demandeFormData.type_conge === 'demi_journee'}
                        onChange={(e) => {
                          handleDemandeInputChange('type_conge', e.target.value);
                          handleDemandeInputChange('demi_journee', true);
                          // ✅ FIX 1: auto-set 0.5 when demi_journee is selected
                          handleDemandeInputChange('nombre_jours', '0.5');
                        }}
                        className="radio-input"
                      />
                      Demi-journée
                    </label>
                  </div>
                  {errors.type_conge && <div className="error-message"><AlertCircle size={16} /> {errors.type_conge}</div>}
                </div>
              )}

              {demandeFormData.type_demande === 'conges' && (
                <div className="form-section">
                  <label className="form-label">
                    <Calendar className="form-label-icon" />
                    Nombre de jours ouvrables *
                  </label>
                  {/* Auto-calculated from dates, but still editable for public holidays */}
                  <input
                    type="number"
                    min={demandeFormData.type_conge === 'demi_journee' ? '0.5' : '1'}
                    step={demandeFormData.type_conge === 'demi_journee' ? '0.5' : '1'}
                    value={demandeFormData.nombre_jours}
                    onChange={(e) => handleDemandeInputChange('nombre_jours', e.target.value)}
                    placeholder={demandeFormData.type_conge === 'demi_journee' ? '0.5' : 'Ex: 5'}
                    disabled={demandeFormData.type_conge === 'demi_journee'}
                    className={`form-input ${errors.nombre_jours ? 'error' : ''}`}
                  />
                  {errors.nombre_jours && <div className="error-message"><AlertCircle size={16} /> {errors.nombre_jours}</div>}
                </div>
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

                  {/* Frais de déplacement section - Hidden for missions as requested */}
                  <div className="form-section" style={{ display: 'none' }}>
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
                    <span>
                      {demandeFormData.type_demande === 'avance_salaire' 
                        ? 'Soumettre la demande d\'avance' 
                        : demandeFormData.type_demande === 'revision_salaire'
                        ? 'Soumettre la demande de révision'
                        : 'Soumettre la demande'}
                    </span>
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
