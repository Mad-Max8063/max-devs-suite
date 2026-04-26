import React, { useMemo, useState } from 'react';
import { Service, BUSINESS_CATEGORIES, BusinessCategory } from '../constants';

interface ServiceManagerProps {
    services: Service[];
    selectedCategoryId: string | null;
    onServicesChange: (services: Service[]) => void;
    onCategoryChange: (categoryId: string) => void;
}

/**
 * ServiceManager — Business owner component for managing services.
 * Allows selecting a business category, editing services, and adding custom ones.
 */
const ServiceManager: React.FC<ServiceManagerProps> = ({
    services,
    selectedCategoryId,
    onServicesChange,
    onCategoryChange,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newService, setNewService] = useState({ nombre: '', duracion: 30, precio: 0, sena: 0 });
    const [categorySearch, setCategorySearch] = useState('');

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    // Load presets from a category
    const handleCategorySelect = (category: BusinessCategory) => {
        const presetServices: Service[] = category.servicios.map((s, index) => ({
            ...s,
            activo: true,
            orden: index,
        }));
        onServicesChange(presetServices);
        onCategoryChange(category.id);
    };

    const toggleService = (id: string) => {
        onServicesChange(services.map(s =>
            s.id === id ? { ...s, activo: !s.activo } : s
        ));
    };

    const updateService = (id: string, updates: Partial<Service>) => {
        onServicesChange(services.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ));
    };

    const deleteService = (id: string) => {
        onServicesChange(services.filter(s => s.id !== id));
    };

    const addService = () => {
        if (!newService.nombre.trim()) return;
        const id = `custom-${Date.now()}`;
        onServicesChange([
            ...services,
            {
                ...newService,
                id,
                activo: true,
                orden: services.length,
            },
        ]);
        setNewService({ nombre: '', duracion: 30, precio: 0, sena: 0 });
        setShowAddForm(false);
    };

    const selectedCategory = BUSINESS_CATEGORIES.find(c => c.id === selectedCategoryId);
    const groupedCategories = useMemo(() => {
        const query = categorySearch.trim().toLowerCase();
        const matches = BUSINESS_CATEGORIES.filter((category) => {
            if (!query) return true;
            const haystack = [
                category.id,
                category.label,
                category.nombre,
                category.group,
                category.descripcion,
                ...category.searchTags,
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });

        return matches.reduce<Record<string, BusinessCategory[]>>((groups, category) => {
            groups[category.group] = groups[category.group] || [];
            groups[category.group].push(category);
            return groups;
        }, {});
    }, [categorySearch]);
    const hasCategoryResults = Object.keys(groupedCategories).length > 0;

    return (
        <div className="space-y-4">
            {/* Category Selector */}
            <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Rubro de tu negocio
                </label>
                <div className="relative mb-3">
                    <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-3 flex items-center text-[18px] text-gray-400">search</span>
                    <input
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                        placeholder="Buscar rubro o especialidad"
                        className="w-full rounded-xl border border-white/10 bg-surface/60 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-white/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                    {hasCategoryResults ? (
                        Object.entries(groupedCategories).map(([group, categories]) => (
                            <section key={group} className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{group}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategorySelect(cat)}
                                            className={`
                                                p-3 rounded-xl border-2 text-left transition-all
                                                ${selectedCategoryId === cat.id
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-white/10 bg-surface/60 hover:border-primary/40 hover:bg-surface'
                                                }
                                            `}
                                        >
                                            <span className="material-symbols-outlined text-xl text-primary">{cat.icon}</span>
                                            <p className={`text-xs font-medium mt-1 ${selectedCategoryId === cat.id ? 'text-primary' : 'text-on-surface'}`}>
                                                {cat.nombre}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs font-medium text-gray-400 dark:border-gray-700">
                            No encontramos ese rubro. Podes elegir Personalizado.
                        </div>
                    )}
                </div>
            </div>

            {/* Services List */}
            {services.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Servicios {selectedCategory ? `(${selectedCategory.nombre})` : ''}
                        </label>
                        <span className="text-xs text-gray-400">
                            {services.filter(s => s.activo).length} activos
                        </span>
                    </div>

                    <div className="space-y-2">
                        {services.map(service => (
                            <div
                                key={service.id}
                                className={`rounded-xl border p-3 transition-all ${service.activo
                                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark'
                                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                                    }`}
                            >
                                {editingId === service.id ? (
                                    /* Editing mode */
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={service.nombre}
                                            onChange={(e) => updateService(service.id, { nombre: e.target.value })}
                                            className="w-full text-sm font-medium bg-transparent border-b border-primary pb-1 focus:outline-none dark:text-white"
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] text-gray-400 block">Duración (min)</label>
                                                <input
                                                    type="number"
                                                    value={service.duracion}
                                                    onChange={(e) => updateService(service.id, { duracion: Number(e.target.value) })}
                                                    className="w-full text-xs bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                                    min={5}
                                                    step={5}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 block">Precio</label>
                                                <input
                                                    type="number"
                                                    value={service.precio}
                                                    onChange={(e) => updateService(service.id, { precio: Number(e.target.value) })}
                                                    className="w-full text-xs bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                                    min={0}
                                                    step={500}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 block">Seña</label>
                                                <input
                                                    type="number"
                                                    value={service.sena}
                                                    onChange={(e) => updateService(service.id, { sena: Number(e.target.value) })}
                                                    className="w-full text-xs bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                                    min={0}
                                                    step={500}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => deleteService(service.id)}
                                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                Eliminar
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark"
                                            >
                                                Listo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Display mode */
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleService(service.id)}
                                            className={`size-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${service.activo
                                                    ? 'border-primary bg-primary'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                        >
                                            {service.activo && (
                                                <span className="material-symbols-outlined text-white text-[14px]">check</span>
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                                                {service.nombre}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatDuration(service.duracion)} · {formatPrice(service.precio)}
                                                {service.sena > 0 && ` · Seña ${formatPrice(service.sena)}`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setEditingId(service.id)}
                                            className="text-gray-400 hover:text-primary"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Custom Service */}
            {showAddForm ? (
                <div className="rounded-xl border-2 border-dashed border-primary/30 p-3 space-y-3 bg-primary/5 dark:bg-primary/10">
                    <input
                        type="text"
                        value={newService.nombre}
                        onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                        placeholder="Nombre del servicio"
                        className="w-full text-sm bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 dark:text-white"
                        autoFocus
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400 block">Duración (min)</label>
                            <input
                                type="number"
                                value={newService.duracion}
                                onChange={(e) => setNewService({ ...newService, duracion: Number(e.target.value) })}
                                className="w-full text-xs bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                min={5}
                                step={5}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block">Precio</label>
                            <input
                                type="number"
                                value={newService.precio}
                                onChange={(e) => setNewService({ ...newService, precio: Number(e.target.value) })}
                                className="w-full text-xs bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                min={0}
                                step={500}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block">Seña</label>
                            <input
                                type="number"
                                value={newService.sena}
                                onChange={(e) => setNewService({ ...newService, sena: Number(e.target.value) })}
                                className="w-full text-xs bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:text-white"
                                min={0}
                                step={500}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowAddForm(false); setNewService({ nombre: '', duracion: 30, precio: 0, sena: 0 }); }}
                            className="flex-1 text-xs text-gray-500 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={addService}
                            disabled={!newService.nombre.trim()}
                            className="flex-1 text-xs bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                            Agregar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Agregar servicio personalizado
                </button>
            )}
        </div>
    );
};

export default ServiceManager;
