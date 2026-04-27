import React from 'react';
import { FeedConfiguration } from './FeedConfiguration';
import { ProposalPrompts } from './ProposalPrompts';

export const PromptsView = ({ 
  formData, 
  onInputChange,
  formStates, 
  feedActive,
  onFeedActiveChange,
  allowNoBudget,
  onAllowNoBudgetChange,
  proposals,
  onAddProposal,
  onUpdateProposal,
  onRemoveProposal,
  onSaveFeed,
  onSaveProposals,
}) => {
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
        onFeedActiveChange={onFeedActiveChange}
        onInputChange={onInputChange}
        onSave={onSaveFeed}
        formStates={formStates}
        allowNoBudget={allowNoBudget}
        onAllowNoBudgetChange={onAllowNoBudgetChange}
      />

      <ProposalPrompts
        proposals={proposals}
        onAdd={onAddProposal}
        onUpdate={onUpdateProposal}
        onRemove={onRemoveProposal}
        formData={formData}
        onInputChange={onInputChange}
        formStates={formStates}
        onSave={onSaveProposals}
      />
    </div>
  );
};