import { useState } from "react";
import { useProductos, useCreateProducto, useUpdateProducto, useDeleteProducto } from "../../hooks/useProductos";
import { useTurnoActual } from "../../hooks/useCaja";
import { PageInfoNote, useToast } from "../../components/ui";
import { ProductsHeader, ProductsTable, ProductCreateView } from "./components";
import { Link } from "react-router-dom";

export default function ProductosPage() {
  const [section, setSection] = useState("list");
  const [editingProduct, setEditingProduct] = useState(null);
  const { data: products = [], isLoading, error } = useProductos();
  const turnoActual = useTurnoActual();
  const createProducto = useCreateProducto();
  const updateProducto = useUpdateProducto();
  const deleteProducto = useDeleteProducto();
  const { pushToast } = useToast();

  const handleCreate = async (formData) => {
    if (!turnoActual.data?.id) {
      pushToast({ tone: "warning", title: "Debes abrir caja antes de registrar productos" });
      return;
    }
    try {
      await createProducto.mutateAsync(formData);
      pushToast({ tone: "success", title: "Producto creado" });
      setEditingProduct(null);
      setSection("list");
    } catch {
      pushToast({ tone: "error", title: "Error al crear producto" });
    }
  };

  const handleUpdate = async (id, formData) => {
    if (!turnoActual.data?.id) {
      pushToast({ tone: "warning", title: "Debes abrir caja antes de actualizar productos" });
      return;
    }
    try {
      await updateProducto.mutateAsync({ id, data: formData });
      pushToast({ tone: "success", title: "Producto actualizado" });
      setEditingProduct(null);
      setSection("list");
    } catch {
      pushToast({ tone: "error", title: "Error al actualizar" });
    }
  };

  const handleStartEdit = (product) => {
    setEditingProduct(product);
    setSection("create");
  };

  const handleSaveForm = async (formData) => {
    if (editingProduct?.id) {
      await handleUpdate(editingProduct.id, formData);
      return;
    }
    await handleCreate(formData);
  };

  const handleCancelForm = () => {
    setEditingProduct(null);
    setSection("list");
  };

  const handleCreateView = () => {
    setEditingProduct(null);
    setSection("create");
  };

  const handleDelete = async (id) => {
    if (!turnoActual.data?.id) {
      pushToast({ tone: "warning", title: "Debes abrir caja antes de eliminar productos" });
      return;
    }
    try {
      await deleteProducto.mutateAsync(id);
      pushToast({ tone: "success", title: "Producto eliminado" });
    } catch {
      pushToast({ tone: "error", title: "Error al eliminar" });
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-500">Cargando productos...</div>;
  if (error) return <div className="flex h-64 items-center justify-center text-red-500">Error al cargar productos</div>;

  return (
    <div className="flex h-full flex-col space-y-4">
      {!turnoActual.isLoading && !turnoActual.data?.id ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          Debes abrir caja para registrar cambios en productos. <Link to="/facturas" className="font-semibold underline">Ir a Caja</Link>
        </div>
      ) : null}
      <ProductsHeader section={section} onChangeSection={setSection} onCreate={handleCreateView} />
      <PageInfoNote module="productos" />
      {section === "list" ? (
        <ProductsTable products={products} onEdit={handleStartEdit} onDelete={handleDelete} />
      ) : null}
      {section === "create" ? (
        <ProductCreateView
          initialData={editingProduct}
          onCancel={handleCancelForm}
          onSubmit={handleSaveForm}
        />
      ) : null}
    </div>
  );
}
