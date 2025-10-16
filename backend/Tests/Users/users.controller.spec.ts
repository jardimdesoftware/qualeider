import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@/presentation/controllers/users.controller';
import { UsersService } from '@/application/services/users/users.service';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  partialUpdate: jest.fn(),
  remove: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call usersService.create and return the result', async () => {
      const createUserDto = {} as CreateUserDto; // Mock DTO
      const expectedResult = { id: 1, name: 'New User' };
      (service.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne with a numeric ID', async () => {
      const userId = '1';
      const expectedResult = { id: 1, name: 'User One' };
      (service.findOne as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId);

      expect(service.findOne).toHaveBeenCalledWith(1); // Ensure string is converted to number
      expect(result).toBe(expectedResult);
    });

    it('should throw BadRequestException for an invalid ID', async () => {
      const invalidId = 'abc';

      await expect(controller.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return the result', async () => {
      const expected = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      (service.findAll as jest.Mock).mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should call usersService.update with numeric id and dto', async () => {
      const id = '3';
      const dto = { name: 'Updated' } as any;
      const expected = { id: 3, name: 'Updated' };
      (service.update as jest.Mock).mockResolvedValue(expected);

      const result = await controller.update(id, dto);

      expect(service.update).toHaveBeenCalledWith(3, dto);
      expect(result).toBe(expected);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.update('abc', {} as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('partialUpdate', () => {
    it('should call usersService.partialUpdate with numeric id and dto', async () => {
      const id = '4';
      const dto = { city: 'City' } as any;
      const expected = { id: 4, city: 'City' };
      (service.partialUpdate as jest.Mock).mockResolvedValue(expected);

      const result = await controller.partialUpdate(id, dto);

      expect(service.partialUpdate).toHaveBeenCalledWith(4, dto);
      expect(result).toBe(expected);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.partialUpdate('bad', {} as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.partialUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should call usersService.remove with numeric id', async () => {
      const id = '5';
      const expected = { message: 'removed' };
      (service.remove as jest.Mock).mockResolvedValue(expected);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(5);
      expect(result).toBe(expected);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.remove('NaN')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.remove).not.toHaveBeenCalled();
    });
  });
});
