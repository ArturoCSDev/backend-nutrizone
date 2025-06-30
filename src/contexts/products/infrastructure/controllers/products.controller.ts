import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../../../shared/infrastructure/utils/response.util';
import { logger } from '../../../../shared/infrastructure/utils/logger.util';

// Repositorios
import { PrismaCategoriaRepository } from '../repositories/prisma-categoria.repository';
import { PrismaTamanoRepository } from '../repositories/prisma-tamano.repository';
import { PrismaSaborRepository } from '../repositories/prisma-sabor.repository';
import { PrismaProductoRepository } from '../repositories/prisma-producto.repository';

// Use Cases
import { ListCategoriaUseCase } from '../../application/list-categorias/list-categoria.use-case';
import { ListTamanoUseCase } from '../../application/list-tamanos/list-tamano.use-case';
import { ListSaborUseCase } from '../../application/list-sabor/list-sabor.use-case';
import { CreateSaborUseCase } from '../../application/create-sabor/create-sabor.use-case';
import { UpdateSaborUseCase } from '../../application/update-sabor/update-sabor.use-case';
import { DeleteSaborUseCase } from '../../application/delete-sabor/delete-sabor.use-case';
import { ListProductoUseCase } from '../../application/list-products/list-producto.use-case';
import { CreateProductoUseCase } from '../../application/create-product/create-producto.use-case';
import { UpdateProductoUseCase } from '../../application/update-product/update-producto.use-case';
import { DeleteProductoUseCase } from '../../application/delete-product/delete-producto.use-case';

export class ProductsController {
  // Instanciación manual de repositorios
  private readonly categoriaRepository = new PrismaCategoriaRepository();
  private readonly tamanoRepository = new PrismaTamanoRepository();
  private readonly saborRepository = new PrismaSaborRepository();
  private readonly productoRepository = new PrismaProductoRepository();

  // Instanciación de use cases
  private readonly listCategoriaUseCase = new ListCategoriaUseCase(
    this.categoriaRepository
  );

  private readonly listTamanoUseCase = new ListTamanoUseCase(
    this.tamanoRepository
  );

  private readonly listSaborUseCase = new ListSaborUseCase(
    this.saborRepository
  );

  private readonly createSaborUseCase = new CreateSaborUseCase(
    this.saborRepository
  );

  private readonly updateSaborUseCase = new UpdateSaborUseCase(
    this.saborRepository
  );

  private readonly deleteSaborUseCase = new DeleteSaborUseCase(
    this.saborRepository
  );

  private readonly listProductoUseCase = new ListProductoUseCase(
    this.productoRepository
  );

  private readonly createProductoUseCase = new CreateProductoUseCase(
    this.productoRepository
  );

  private readonly updateProductoUseCase = new UpdateProductoUseCase(
    this.productoRepository
  );

  private readonly deleteProductoUseCase = new DeleteProductoUseCase(
    this.productoRepository
  );

  // =============================================
  // ENDPOINTS DE CATEGORÍAS
  // =============================================

  listCategorias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing categories', { query: req.query });

      const result = await this.listCategoriaUseCase.execute(req.query);
      
      logger.info('Categories listed successfully', { 
        total: result.total
      });

      const response = ResponseUtil.success(result, 'Categorías obtenidas exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list categories', { error: errorMessage });
      next(error);
    }
  };

  getCategoriaById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Getting category by ID', { categoriaId: id });

      const categoria = await this.categoriaRepository.findById(id);

      if (!categoria) {
        logger.warn('Category not found', { categoriaId: id });
        const response = ResponseUtil.error('Categoría no encontrada');
        res.status(404).json(response);
        return;
      }

      logger.info('Category found successfully', { categoriaId: id, nombre: categoria.nombre });
      const response = ResponseUtil.success(categoria, 'Categoría obtenida exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get category', { categoriaId: req.params.id, error: errorMessage });
      next(error);
    }
  };

  getCategoriasByTipo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tipoProducto } = req.params;
      logger.info('Getting categories by type', { tipoProducto });

      // Validar que el tipo de producto sea válido
      const tiposValidos = ['BATIDO', 'REFRESCO', 'WAFFLE'];
      if (!tiposValidos.includes(tipoProducto.toUpperCase())) {
        logger.warn('Invalid product type', { tipoProducto, tiposValidos });
        const response = ResponseUtil.error('Tipo de producto no válido', 'INVALID_PRODUCT_TYPE', { tiposValidos });
        res.status(400).json(response);
        return;
      }

      const categorias = await this.categoriaRepository.findByTipoProducto(tipoProducto.toUpperCase() as any);

      logger.info('Categories by type found successfully', { tipoProducto, total: categorias.length });
      const response = ResponseUtil.success(
        { categorias, tipoProducto: tipoProducto.toUpperCase(), total: categorias.length }, 
        'Categorías obtenidas exitosamente'
      );
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get categories by type', { tipoProducto: req.params.tipoProducto, error: errorMessage });
      next(error);
    }
  };

  // =============================================
  // ENDPOINTS DE TAMAÑOS
  // =============================================

  listTamanos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing sizes', { query: req.query });

      const result = await this.listTamanoUseCase.execute(req.query);
      
      logger.info('Sizes listed successfully', { 
        total: result.total
      });

      const response = ResponseUtil.success(result, 'Tamaños obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list sizes', { error: errorMessage });
      next(error);
    }
  };

  getTamanoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Getting size by ID', { tamanoId: id });

      const tamano = await this.tamanoRepository.findById(id);

      if (!tamano) {
        logger.warn('Size not found', { tamanoId: id });
        const response = ResponseUtil.error('Tamaño no encontrado');
        res.status(404).json(response);
        return;
      }

      logger.info('Size found successfully', { tamanoId: id, nombre: tamano.nombre });
      const response = ResponseUtil.success(tamano, 'Tamaño obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get size', { tamanoId: req.params.id, error: errorMessage });
      next(error);
    }
  };

  getTamanosByVolumen = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { min, max } = req.params;
      const minVolumen = Number(min);
      const maxVolumen = Number(max);
      
      logger.info('Getting sizes by volume range', { minVolumen, maxVolumen });

      // Validar que sean números válidos
      if (isNaN(minVolumen) || isNaN(maxVolumen)) {
        logger.warn('Invalid volume values', { min, max });
        const response = ResponseUtil.error('Los valores de volumen deben ser números válidos', 'INVALID_VOLUME_VALUES');
        res.status(400).json(response);
        return;
      }

      if (minVolumen < 0 || maxVolumen < 0) {
        logger.warn('Negative volume values', { minVolumen, maxVolumen });
        const response = ResponseUtil.error('Los valores de volumen deben ser positivos', 'NEGATIVE_VOLUME_VALUES');
        res.status(400).json(response);
        return;
      }

      if (minVolumen > maxVolumen) {
        logger.warn('Invalid volume range', { minVolumen, maxVolumen });
        const response = ResponseUtil.error('El volumen mínimo no puede ser mayor al máximo', 'INVALID_VOLUME_RANGE');
        res.status(400).json(response);
        return;
      }

      const tamanos = await this.tamanoRepository.findByVolumenRange(minVolumen, maxVolumen);

      logger.info('Sizes by volume found successfully', { minVolumen, maxVolumen, total: tamanos.length });
      const response = ResponseUtil.success(
        { tamanos, rangoVolumen: { min: minVolumen, max: maxVolumen }, total: tamanos.length },
        'Tamaños obtenidos exitosamente'
      );
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get sizes by volume', { 
        min: req.params.min, 
        max: req.params.max, 
        error: errorMessage 
      });
      next(error);
    }
  };

  // =============================================
  // ENDPOINTS DE SABORES
  // =============================================

  listSabores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing flavors', { query: req.query });

      const result = await this.listSaborUseCase.execute(req.query);
      
      logger.info('Flavors listed successfully', { 
        total: result.total
      });

      const response = ResponseUtil.success(result, 'Sabores obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list flavors', { error: errorMessage });
      next(error);
    }
  };

  getSaborById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Getting flavor by ID', { saborId: id });

      const sabor = await this.saborRepository.findById(id);

      if (!sabor) {
        logger.warn('Flavor not found', { saborId: id });
        const response = ResponseUtil.error('Sabor no encontrado');
        res.status(404).json(response);
        return;
      }

      logger.info('Flavor found successfully', { saborId: id, nombre: sabor.nombre });
      const response = ResponseUtil.success(sabor, 'Sabor obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get flavor', { saborId: req.params.id, error: errorMessage });
      next(error);
    }
  };

  createSabor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Creating flavor', { nombre: req.body.nombre });

      const result = await this.createSaborUseCase.execute(req.body);
      
      logger.success('Flavor created successfully', { 
        saborId: result.id,
        nombre: result.nombre
      });

      const response = ResponseUtil.created(result, 'Sabor creado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create flavor', { 
        nombre: req.body.nombre, 
        error: errorMessage 
      });
      next(error);
    }
  };

  updateSabor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Updating flavor', { saborId: id, updates: req.body });

      const result = await this.updateSaborUseCase.execute(id, req.body);
      
      logger.success('Flavor updated successfully', { 
        saborId: result.id,
        nombre: result.nombre
      });

      const response = ResponseUtil.success(result, 'Sabor actualizado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update flavor', { 
        saborId: req.params.id, 
        error: errorMessage 
      });
      next(error);
    }
  };

  deleteSabor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Deleting flavor', { saborId: id });

      await this.deleteSaborUseCase.execute(id);
      
      logger.success('Flavor deleted successfully', { saborId: id });

      const response = ResponseUtil.success({ id }, 'Sabor eliminado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete flavor', { 
        saborId: req.params.id, 
        error: errorMessage 
      });
      next(error);
    }
  };

  // =============================================
  // ENDPOINTS DE PRODUCTOS
  // =============================================

  listProductos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Listing products', { query: req.query });

      const result = await this.listProductoUseCase.execute(req.query);
      
      logger.info('Products listed successfully', { 
        total: result.total
      });

      const response = ResponseUtil.success(result, 'Productos obtenidos exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list products', { error: errorMessage });
      next(error);
    }
  };

  getProductoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Getting product by ID', { productoId: id });

      const producto = await this.productoRepository.findById(id);

      if (!producto) {
        logger.warn('Product not found', { productoId: id });
        const response = ResponseUtil.error('Producto no encontrado');
        res.status(404).json(response);
        return;
      }

      logger.info('Product found successfully', { productoId: id, nombre: producto.nombre });
      const response = ResponseUtil.success(producto, 'Producto obtenido exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get product', { productoId: req.params.id, error: errorMessage });
      next(error);
    }
  };

  createProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('Creating product', { nombre: req.body.nombre });

      const result = await this.createProductoUseCase.execute(req.body);
      
      logger.success('Product created successfully', { 
        productoId: result.id,
        nombre: result.nombre
      });

      const response = ResponseUtil.created(result, 'Producto creado exitosamente');
      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create product', { 
        nombre: req.body.nombre, 
        error: errorMessage 
      });
      next(error);
    }
  };

  updateProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Updating product', { productoId: id, updates: req.body });

      const result = await this.updateProductoUseCase.execute(id, req.body);
      
      logger.success('Product updated successfully', { 
        productoId: result.id,
        nombre: result.nombre
      });

      const response = ResponseUtil.success(result, 'Producto actualizado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update product', { 
        productoId: req.params.id, 
        error: errorMessage 
      });
      next(error);
    }
  };

  deleteProducto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      logger.info('Deleting product', { productoId: id });

      await this.deleteProductoUseCase.execute(id);
      
      logger.success('Product deleted successfully', { productoId: id });

      const response = ResponseUtil.success({ id }, 'Producto eliminado exitosamente');
      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete product', { 
        productoId: req.params.id, 
        error: errorMessage 
      });
      next(error);
    }
  };
}