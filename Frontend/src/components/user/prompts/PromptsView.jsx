import React, { useState } from 'react';
import { FeedConfiguration } from './FeedConfiguration';
import { ProposalPrompts } from './ProposalPrompts';

export const PromptsView = ({ 
  formData, 
  setFormData, 
  formStates, 
  setFormStates,
  onSave 
}) => {
  const [feedActive, setFeedActive] = useState(true);
  const [allowNoBudget, setAllowNoBudget] = useState(true);
  const [proposals, setProposals] = useState([
    { id: 1, title: 'Roles and task:', content: 'You are a agency founder...' },
    { id: 2, title: 'General rules:', content: '1) If the job post requires...' },
    { id: 3, title: 'Format must be:', content: '' }
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (['feedName', 'keywords', 'speciality', 'freelancer', 'minHourlyRate', 'minFixedRate', 'clientMinSpend', 'clientMinRating'].includes(field)) {
      setFormStates(prev => ({ ...prev, feedSaved: false }));
    } else if (field === 'model') {
      setFormStates(prev => ({ ...prev, proposalsSaved: false }));
    }
  };

  const handleFeedActiveChange = (checked) => {
    setFeedActive(checked);
    setFormStates(prev => ({ ...prev, feedSaved: false }));
  };

  const handleAllowNoBudgetChange = (checked) => {
    setAllowNoBudget(checked);
    setFormStates(prev => ({ ...prev, feedSaved: false }));
  };

  const addProposal = () => {
    const newId = proposals.length + 1;
    setProposals([...proposals, { id: newId, title: `Field ${newId}`, content: '' }]);
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  const updateProposal = (id, field, value) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, [field]: value } : p));
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  const removeProposal = (id) => {
    setProposals(proposals.filter(p => p.id !== id));
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Prompts Configuration
        </h2>
        <p className="text-gray-400">Manage your feed configurations and prompts</p>
      </div>

      <FeedConfiguration
        formData={formData}
        feedActive={feedActive}
        onFeedActiveChange={handleFeedActiveChange}
        onInputChange={handleInputChange}
        onSave={() => onSave('feedSaved')}
        formStates={formStates}
        allowNoBudget={allowNoBudget}
        onAllowNoBudgetChange={handleAllowNoBudgetChange}
      />

      <ProposalPrompts
        proposals={proposals}
        onAdd={addProposal}
        onUpdate={updateProposal}
        onRemove={removeProposal}
        formData={formData}
        onInputChange={handleInputChange}
        formStates={formStates}
        onSave={() => onSave('proposalsSaved')}
      />
    </div>
  );
};