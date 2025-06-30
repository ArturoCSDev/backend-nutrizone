import { Router } from 'express';
import { ProductsController } from './products.controller';
import { validationMiddleware } from '../../../../shared/infrastructure/middleware/validation.middleware';

// DTOs
import { ListCategoriaDto } from '../../application/list-categorias/list-categoria.dto';
import { ListTamanoDto } from '../../application/list-tamanos/list-tamano.dto';
import { ListSaborDto } from '../../application/list-sabor/list-sabor.dto';
import { CreateSaborDto } from '../../application/create-sabor/create-sabor.dto';
import { UpdateSaborDto } from '../../application/update-sabor/update-sabor.dto';
import { ListProductoDto } from '../../application/list-products/list-producto.dto';
import { CreateProductoDto } from '../../application/create-product/create-producto.dto';
import { UpdateProductoDto } from '../../application/update-product/update-producto.dto';

const router = Router();
const productsController = new ProductsController();

// =============================================
// RUTAS DE CATEGORÍAS - PÚBLICAS
// =============================================

/**
 * @route GET /products/categorias
 * @desc Listar todas las categorías con filtros opcionales
 * @access Public
 */
router.get('/categorias',
  validationMiddleware(ListCategoriaDto),
  productsController.listCategorias
);

/**
 * @route GET /products/categorias/:id
 * @desc Obtener una categoría específica por ID
 * @access Public
 */
router.get('/categorias/:id',
  productsController.getCategoriaById
);

/**
 * @route GET /products/categorias/tipo/:tipoProducto
 * @desc Obtener categorías filtradas por tipo de producto
 * @access Public
 */
router.get('/categorias/tipo/:tipoProducto',
  productsController.getCategoriasByTipo
);

// =============================================
// RUTAS DE TAMAÑOS - PÚBLICAS
// =============================================

/**
 * @route GET /products/tamanos
 * @desc Listar todos los tamaños con filtros opcionales
 * @access Public
 */
router.get('/tamanos',
  validationMiddleware(ListTamanoDto),
  productsController.listTamanos
);

/**
 * @route GET /products/tamanos/:id
 * @desc Obtener un tamaño específico por ID
 * @access Public
 */
router.get('/tamanos/:id',
  productsController.getTamanoById
);

/**
 * @route GET /products/tamanos/volumen/:min/:max
 * @desc Obtener tamaños filtrados por rango de volumen
 * @access Public
 */
router.get('/tamanos/volumen/:min/:max',
  productsController.getTamanosByVolumen
);

// =============================================
// RUTAS DE SABORES - PÚBLICAS
// =============================================

/**
 * @route GET /products/sabores
 * @desc Listar todos los sabores con filtros opcionales
 * @access Public
 */
router.get('/sabores',
  validationMiddleware(ListSaborDto),
  productsController.listSabores
);

/**
 * @route GET /products/sabores/:id
 * @desc Obtener un sabor específico por ID
 * @access Public
 */
router.get('/sabores/:id',
  productsController.getSaborById
);

// =============================================
// RUTAS DE SABORES - PROTEGIDAS (ADMIN ONLY)
// =============================================

/**
 * @route POST /products/sabores
 * @desc Crear un nuevo sabor
 * @access Private (Solo Admin)
 */
router.post('/sabores',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  validationMiddleware(CreateSaborDto),
  productsController.createSabor
);

/**
 * @route PUT /products/sabores/:id
 * @desc Actualizar un sabor existente
 * @access Private (Solo Admin)
 */
router.put('/sabores/:id',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  validationMiddleware(UpdateSaborDto),
  productsController.updateSabor
);

/**
 * @route DELETE /products/sabores/:id
 * @desc Eliminar un sabor
 * @access Private (Solo Admin)
 */
router.delete('/sabores/:id',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  productsController.deleteSabor
);

// =============================================
// RUTAS DE PRODUCTOS - PÚBLICAS
// =============================================

/**
 * @route GET /products/productos
 * @desc Listar todos los productos con filtros opcionales
 * @access Public
 */
router.get('/productos',
  validationMiddleware(ListProductoDto),
  productsController.listProductos
);

/**
 * @route GET /products/productos/:id
 * @desc Obtener un producto específico por ID
 * @access Public
 */
router.get('/productos/:id',
  productsController.getProductoById
);

// =============================================
// RUTAS DE PRODUCTOS - PROTEGIDAS (ADMIN ONLY)
// =============================================

/**
 * @route POST /products/productos
 * @desc Crear un nuevo producto
 * @access Private (Solo Admin)
 */
router.post('/productos',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  validationMiddleware(CreateProductoDto),
  productsController.createProducto
);

/**
 * @route PUT /products/productos/:id
 * @desc Actualizar un producto existente
 * @access Private (Solo Admin)
 */
router.put('/productos/:id',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  validationMiddleware(UpdateProductoDto),
  productsController.updateProducto
);

/**
 * @route DELETE /products/productos/:id
 * @desc Eliminar un producto
 * @access Private (Solo Admin)
 */
router.delete('/productos/:id',
  // authMiddleware, // Descomenta cuando tengas el middleware
  // roleMiddleware('ADMINISTRADOR'), // Descomenta cuando tengas el middleware
  productsController.deleteProducto
);

// =============================================
// RUTAS FUTURAS - PRODUCTOS
// =============================================

// TODO: Implementar en el futuro
// router.get('/productos', productsController.listProductos);
// router.get('/productos/:id', productsController.getProductoById);
// router.post('/productos', validationMiddleware(CreateProductoDto), productsController.createProducto);
// router.put('/productos/:id', validationMiddleware(UpdateProductoDto), productsController.updateProducto);
// router.delete('/productos/:id', productsController.deleteProducto);

export { router as productsRoutes };