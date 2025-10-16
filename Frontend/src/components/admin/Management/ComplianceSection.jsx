import { AlertTriangle, Shield, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import MetricCard from "../utils/MatricCard";
import DataTable from "../utils/DataTable";
import { Modal } from "../utils/Model";
import ReviewForm from "../utils/ReviewForm";

const ComplianceSection = () => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const complianceMetrics = [
    { title: 'Flagged Accounts', value: '23', change: '-5', icon: AlertTriangle, trend: 'down' },
    { title: 'Compliance Score', value: '94.2%', change: '+1.3%', icon: Shield },
    { title: 'Resolved Issues', value: '187', change: '+23', icon: CheckCircle },
    { title: 'Pending Reviews', value: '12', change: '+3', icon: Clock }
  ];

  const [flaggedData, setFlaggedData] = useState([
    { user: 'user@example1.com', reason: 'High frequency sending', severity: 'Medium', status: 'Under Review' },
    { user: 'user@example2.com', reason: 'Template similarity', severity: 'Low', status: 'Resolved' },
    { user: 'user@example3.com', reason: 'Response rate anomaly', severity: 'High', status: 'Suspended' },
    { user: 'user@example4.com', reason: 'Terms violation', severity: 'High', status: 'Under Review' }
  ]);

  const handleReview = (account) => {
    setSelectedAccount(account);
    setIsReviewModalOpen(true);
  };

  const handleResolve = (account) => {
    if (window.confirm(`Are you sure you want to resolve the issue for ${account.user}?`)) {
      // Update the status to Resolved
      setFlaggedData(prevData => 
        prevData.map(item => 
          item.user === account.user 
            ? { ...item, status: 'Resolved' } 
            : item
        )
      );
      alert(`Issue resolved for ${account.user}`);
      // Here you would typically make an API call to update the status
      console.log('Resolving account:', account);
    }
  };

  const handleSubmitReview = (reviewData) => {
    console.log('Review submitted:', reviewData);
    
    // Update the flagged data based on the action taken
    setFlaggedData(prevData => 
      prevData.map(item => 
        item.user === selectedAccount.user 
          ? { ...item, status: reviewData.action === 'resolve' ? 'Resolved' : reviewData.action === 'suspend' ? 'Suspended' : 'Under Review' } 
          : item
      )
    );
    
    setIsReviewModalOpen(false);
    setSelectedAccount(null);
    alert('Review submitted successfully!');
    
    // Here you would typically make an API call to save the review
  };

  const flaggedActions = [
    { 
      label: 'Review', 
      className: 'bg-blue-600 text-white hover:bg-blue-700', 
      onClick: handleReview
    },
    { 
      label: 'Resolve', 
      className: 'bg-green-600 text-white hover:bg-green-700', 
      onClick: handleResolve
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Compliance & Safety</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {complianceMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <h3 className="text-white text-lg font-semibold mb-4">Flagged Accounts</h3>
        <DataTable 
          headers={['User', 'Reason', 'Severity', 'Status']} 
          data={flaggedData} 
          actions={flaggedActions}
        />
      </div>

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAccount(null);
        }} 
        title="Review Flagged Account"
      >
        {selectedAccount && (
          <ReviewForm 
            account={selectedAccount}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedAccount(null);
            }} 
            onSubmit={handleSubmitReview}
          />
        )}
      </Modal>
    </div>
  );
};

export default ComplianceSection;