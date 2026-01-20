import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { InteractiveCard } from '../ui/InteractiveCard';
import { InputField } from '../ui/InputField';
import { TextareaField } from '../ui/TextareaField';
import { StatusButton } from '../ui/StatusButton';

export const ProposalPrompts = ({ 
  proposals, 
  onAdd, 
  onUpdate, 
  onRemove,
  formData,
  onInputChange,
  formStates,
  onSave
}) => {
  return (
    <InteractiveCard className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
        <h3 className="text-white text-xl font-semibold">Proposal generation prompt</h3>
        <div className="flex flex-wrap gap-2">
          <StatusButton
            isComplete={formStates.proposalsSaved}
            label={formStates.proposalsSaved ? "Saved" : "Save Changes"}
            onClick={onSave}
          />
          <button
            onClick={onAdd}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2 font-medium">Model</label>
        <select
          value={formData.model}
          onChange={(e) => onInputChange('model', e.target.value)}
          className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200"
        >
          <option value="GPT-4o Mini">GPT-4o Mini</option>
          <option value="GPT-4">GPT-4</option>
          <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="space-y-6">
        {proposals.map((proposal) => (
          <InteractiveCard key={proposal.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-gray-300 text-lg font-medium">Field {proposal.id}</h4>
              {proposals.length > 3 && (
                <button
                  onClick={() => onRemove(proposal.id)}
                  className="text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <InputField
                label="Title"
                value={proposal.title}
                onChange={(value) => onUpdate(proposal.id, 'title', value)}
              />
              <TextareaField
                label="Content"
                value={proposal.content}
                onChange={(value) => onUpdate(proposal.id, 'content', value)}
                placeholder="Enter your prompt content here..."
              />
            </div>
          </InteractiveCard>
        ))}
      </div>
    </InteractiveCard>
  );
};