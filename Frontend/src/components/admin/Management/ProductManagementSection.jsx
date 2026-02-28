import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, X, CheckCircle, XCircle, Star, Trash2, Edit3, ChevronLeft, ChevronRight } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { Modal } from "../utils/Model";
import DataTable from "../utils/DataTable";
import { LoadingState } from "../utils/LoadingState";
import { getAllProducts, createProduct, updateProduct, deleteProduct, seedProducts } from "../../../utils/api";

const ITEMS_PER_PAGE = 10;

const ProductManagementSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState({
    key: "",
    name: "",
    tag: "",
    monthlyPrice: 0,
    annualPrice: 0,
    annualDiscount: 20,
    price: "",
    features: [""],
    isPopular: false,
    isActive: true,
    order: 0,
    description: "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllProducts();
      if (result.success) {
        setProducts(result.data.data || []);
      } else {
        console.error("Error fetching products:", result.error?.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtering
  const filteredProducts = searchTerm
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.key?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Form helpers
  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      tag: "",
      monthlyPrice: 0,
      annualPrice: 0,
      annualDiscount: 20,
      price: "",
      features: [""],
      isPopular: false,
      isActive: true,
      order: 0,
      description: "",
    });
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    // product row has _id stored
    const original = products.find((p) => p._id === product._id);
    if (!original) return;
    setEditingProduct(original);
    setFormData({
      key: original.key || "",
      name: original.name || "",
      tag: original.tag || "",
      monthlyPrice: original.monthlyPrice ?? 0,
      annualPrice: original.annualPrice ?? 0,
      annualDiscount: original.annualDiscount ?? 20,
      price: original.price || "",
      features: original.features?.length ? [...original.features] : [""],
      isPopular: original.isPopular || false,
      isActive: original.isActive !== undefined ? original.isActive : true,
      order: original.order || 0,
      description: original.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.filter((f) => f.trim() !== ""),
      };

      let result;
      if (editingProduct) {
        result = await updateProduct(editingProduct._id, payload);
      } else {
        result = await createProduct(payload);
      }

      if (result.success) {
        fetchProducts();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(result.error?.message || "Error saving product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product");
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.Name || product.name}"? This cannot be undone.`)) return;
    try {
      const result = await deleteProduct(product._id);
      if (result.success) {
        fetchProducts();
      } else {
        alert(result.error?.message || "Error deleting product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    try {
      const result = await seedProducts();
      if (result.success) {
        fetchProducts();
        alert("Default products seeded successfully!");
      } else {
        alert(result.error?.message || "Error seeding products");
      }
    } catch (error) {
      console.error("Error seeding products:", error);
    } finally {
      setSeeding(false);
    }
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index) => {
    const updated = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updated.length ? updated : [""] });
  };

  // Metrics
  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;
  const popularCount = products.filter((p) => p.isPopular).length;

  // Table data
  const tableHeaders = ["Name", "Key", "Tag", "Monthly", "Annual", "Discount", "Features", "Popular", "Status"];
  const tableData = paginatedProducts.map((p) => ({
    _id: p._id,
    Name: p.name,
    Key: p.key,
    Tag: p.tag || "—",
    Monthly: `$${((p.monthlyPrice || 0) / 100).toFixed(2)}`,
    Annual: `$${((p.annualPrice || 0) / 100).toFixed(2)}`,
    Discount: `${p.annualDiscount ?? 20}%`,
    Features: `${p.features?.length || 0} features`,
    Popular: p.isPopular ? "Yes" : "No",
    Status: p.isActive ? "Active" : "Inactive",
  }));

  const tableActions = [
    {
      label: "Edit",
      onClick: openEditModal,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      label: "Delete",
      onClick: handleDelete,
      className: "bg-red-600 hover:bg-red-700 text-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Product Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage pricing plans and products</p>
        </div>
        <div className="flex gap-2">
          {products.length === 0 && (
            <button
              onClick={handleSeedProducts}
              disabled={seeding}
              className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
            >
              {seeding ? "Seeding..." : "Seed Defaults"}
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="bg-lime-400 hover:bg-lime-300 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Products" value={products.length} icon={Package} />
        <MetricCard title="Active" value={activeCount} icon={CheckCircle} trend="up" />
        <MetricCard title="Inactive" value={inactiveCount} icon={XCircle} trend="down" />
        <MetricCard title="Popular" value={popularCount} icon={Star} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or key..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
          <p className="text-gray-400">
            {searchTerm ? "No products match your search." : "Get started by adding your first product or seeding defaults."}
          </p>
        </div>
      ) : (
        <>
          <DataTable headers={tableHeaders} data={tableData} actions={tableActions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingProduct ? "Edit Product" : "Create Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Key (unique identifier)</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              required
              placeholder="e.g. manual, auto, pro"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g. Auto responder"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Tag (e.g. Starter, Pro)</label>
            <input
              type="text"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              placeholder="e.g. Starter, Pro, Enterprise"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Monthly Price (cents)</label>
            <input
              type="number"
              value={formData.monthlyPrice}
              onChange={(e) => {
                const monthly = parseInt(e.target.value) || 0;
                const discount = formData.annualDiscount || 0;
                const calculatedAnnual = Math.round(monthly * 12 * (1 - discount / 100));
                setFormData({ ...formData, monthlyPrice: monthly, annualPrice: calculatedAnnual });
              }}
              required
              min="0"
              placeholder="e.g. 5000 = $50"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
            <p className="text-gray-500 text-xs mt-0.5">= ${(formData.monthlyPrice / 100).toFixed(2)}/month</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Annual Discount (%)</label>
            <input
              type="number"
              value={formData.annualDiscount}
              onChange={(e) => {
                const discount = parseInt(e.target.value) || 0;
                const monthly = formData.monthlyPrice || 0;
                const calculatedAnnual = Math.round(monthly * 12 * (1 - discount / 100));
                setFormData({ ...formData, annualDiscount: discount, annualPrice: calculatedAnnual });
              }}
              min="0"
              max="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Annual Price (cents) — auto-calculated</label>
            <input
              type="number"
              value={formData.annualPrice}
              readOnly
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-sm cursor-not-allowed"
            />
            <p className="text-gray-500 text-xs mt-0.5">= ${(formData.annualPrice / 100).toFixed(2)}/year (saved {formData.annualDiscount}%)</p>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Display Price (legacy, optional)</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. $50/month"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description of this plan"
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400 resize-none"
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Features</label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-lime-400 hover:text-lime-300 text-sm flex items-center gap-1"
              >
                <Plus size={14} /> Add feature
              </button>
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Display Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 accent-lime-400"
              />
              <span className="text-gray-300 text-sm">Popular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 accent-lime-400"
              />
              <span className="text-gray-300 text-sm">Active</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-lime-400 hover:bg-lime-300 text-black py-2.5 rounded-lg font-medium transition-colors"
          >
            {editingProduct ? "Update Product" : "Create Product"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProductManagementSection;
